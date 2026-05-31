/**
 * AR Collection Dunning Cron (Upgraded to Dunning Engine v2)
 * POST /api/cron/ar-collection-dunning
 *
 * يُشغَّل كل أحد الساعة 7 صباحاً (0 7 * * 0)
 * يفحص الذمم المتأخرة ويُصعِّد مستوى الدانينج تلقائياً باستخدام محرك V2:
 *
 * Level 1 (1-30 يوم):  رسالة تذكير ودية
 * Level 2 (31-60 يوم): إشعار رسمي + رسوم تأخير
 * Level 3 (61-90 يوم): إشعار قانوني + احتساب فوائد متأخرات
 * Level 4 (>90 يوم):   تحويل لشركة تحصيل + حظر ائتمان كامل
 *
 * يُرسل تقريراً لـ Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, getClient } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { DunningEngineV2 } from '@/lib/dunning-engine-v2';

const log  = logger.child({ service: 'cron.ar-dunning' });
const CRON = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON && auth !== `Bearer ${CRON}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';
  const now    = new Date();

  // Try to find the active tenant list from the master DB (n11)
  const masterClient = getClient('n11');
  const tenants = await masterClient.tenantAccount.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, subdomain: true },
  }).catch(() => []) as any[];

  // Fallback to defaults if no active tenants exist or table does not exist
  const tenantSlugs = tenants.length > 0 
    ? tenants.map(t => String(t.subdomain || t.id))
    : ['n11', 'default'];

  const summary = {
    processed: 0,
    skippedSnooze: 0,
    skippedPromise: 0,
    letters: 0,
    lateFees: 0,
    blocked: 0,
  };
  const errors: string[] = [];

  for (const slug of tenantSlugs) {
    try {
      const tenantClient = getClient(slug);
      const res = await DunningEngineV2.executeDailyRun(tenantClient as any, now);
      summary.processed += res.processed;
      summary.skippedSnooze += res.skippedSnooze;
      summary.skippedPromise += res.skippedPromise;
      summary.letters += res.letters;
      summary.lateFees += res.lateFees;
      summary.blocked += res.blocked;
      if (res.errors.length > 0) {
        errors.push(...res.errors.map(e => `[${slug}] ${e}`));
      }
    } catch (e: any) {
      errors.push(`Tenant [${slug}] failed: ${e.message}`);
    }
  }

  // Telegram report
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const totalLetters = summary.letters;
  if (token && chatId && totalLetters > 0) {
    const msg   = [
      `📊 *تقرير تحصيل الذمم التلقائي (Dunning Engine v2)*`,
      `📅 ${now.toISOString().split('T')[0]}`,
      `🔔 إجمالي العملاء المعالجين: ${summary.processed}`,
      `✉️ إشعارات مرسلة: ${totalLetters}`,
      `💸 قيود رسوم تأخير مسجلة: ${summary.lateFees}`,
      `🔒 عملاء تم إيقافهم ائتمانياً: ${summary.blocked}`,
      `😴 عملاء مؤجلين (Snoozed): ${summary.skippedSnooze}`,
      `🤝 وعود سداد سارية (Promise-to-Pay): ${summary.skippedPromise}`,
      errors.length > 0 ? `⚠️ أخطاء المعالجة: ${errors.length}` : '',
      dryRun ? '\n🔍 وضع تجريبي' : '',
    ].filter(Boolean).join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }

  log.info('AR Dunning v2 cron complete', { summary, errors });

  return NextResponse.json({
    success: true,
    dryRun,
    summary,
    errors,
    generatedAt: now.toISOString(),
  });
}
