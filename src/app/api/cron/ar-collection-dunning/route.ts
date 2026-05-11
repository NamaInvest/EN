/**
 * AR Collection Dunning Cron
 * POST /api/cron/ar-collection-dunning
 *
 * يُشغَّل كل أحد الساعة 7 صباحاً (0 7 * * 0)
 * يفحص الذمم المتأخرة ويُصعِّد مستوى الدانينج تلقائياً:
 *
 * Level 1 (1-30 يوم):  رسالة تذكير ودية
 * Level 2 (31-60 يوم): إشعار رسمي + توقف الائتمان
 * Level 3 (61-90 يوم): إشعار قانوني
 * Level 4 (>90 يوم):   تحويل لشركة تحصيل
 *
 * يُرسل تقريراً لـ Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log  = logger.child({ service: 'cron.ar-dunning' });
const CRON = process.env.CRON_SECRET ?? 'local-dev';

const DUNNING_LEVELS = [
  { days: 90, level: 4, label: 'تحويل لشركة تحصيل',   severity: '🚨' },
  { days: 60, level: 3, label: 'إشعار قانوني',          severity: '🔴' },
  { days: 30, level: 2, label: 'إشعار رسمي + وقف ائتمان', severity: '🟠' },
  { days: 1,  level: 1, label: 'تذكير ودي',             severity: '🟡' },
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON && auth !== `Bearer ${CRON}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';
  const now    = new Date();

  const p = prisma as any;

  const tenants = await p.tenant?.findMany?.({
    where: { isActive: true },
    select: { id: true, code: true },
  }).catch(() => []) ?? [{ id: 'default', code: 'DEFAULT' }];

  const summary: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalActions = 0;

  for (const tenant of tenants) {
    const tenantId = String(tenant.id ?? tenant.code);

    // Fetch overdue AR invoices
    const overdueInvoices = await p.salesInvoice?.findMany?.({
      where: {
        tenantId,
        status:          { in: ['PARTIALLY_PAID', 'SENT', 'OVERDUE'] },
        remainingAmount: { gt: 0 },
        dueDate:         { lt: now },
      },
      include: {
        customer: { select: { id: true, name: true, nameAr: true, email: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 1000,
    }).catch(() => []) ?? [];

    for (const inv of overdueInvoices) {
      const dueDate    = new Date(inv.dueDate);
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const dunning    = DUNNING_LEVELS.find(d => daysPastDue >= d.days);
      if (!dunning) continue;

      const currentLevel = Number(inv.dunningLevel ?? 0);

      // Only escalate if level increased
      if (dunning.level <= currentLevel) continue;

      summary[dunning.level] = (summary[dunning.level] ?? 0) + 1;
      totalActions++;

      if (!dryRun) {
        // Update dunning level on invoice
        await p.salesInvoice?.update?.({
          where: { id: inv.id },
          data: {
            dunningLevel: dunning.level,
            dunningDate:  now,
            ...(dunning.level >= 2 ? { creditHold: true } : {}),
          },
        }).catch(() => null);

        // Create dunning activity
        await p.collectionActivity?.create?.({
          data: {
            tenantId,
            customerId:   inv.customerId,
            invoiceId:    inv.id,
            type:         `DUNNING_L${dunning.level}`,
            notes:        `${dunning.label} — متأخر ${daysPastDue} يوم — المبلغ: ${Number(inv.remainingAmount ?? 0).toLocaleString('ar-SA')} ر.س`,
            dueAmount:    inv.remainingAmount,
            daysPastDue,
            performedAt:  now,
            performedBy:  'SYSTEM_CRON',
          },
        }).catch(() => null);
      }
    }
  }

  // Telegram report
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (token && chatId && totalActions > 0) {
    const lines = DUNNING_LEVELS.map(d => `${d.severity} Level ${d.level}: ${summary[d.level] ?? 0} فاتورة`);
    const msg   = [
      `📊 *تقرير تحصيل الذمم الأسبوعي*`,
      `📅 ${now.toISOString().split('T')[0]}`,
      `🔔 إجمالي الإجراءات: ${totalActions}`,
      '',
      ...lines,
      dryRun ? '\n🔍 وضع تجريبي — لم يُعدَّل شيء' : '',
    ].filter(Boolean).join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }

  log.info('AR Dunning cron complete', { totalActions, dryRun, summary });

  return NextResponse.json({
    dryRun,
    totalActions,
    summary: DUNNING_LEVELS.map(d => ({ level: d.level, label: d.label, count: summary[d.level] ?? 0 })),
    generatedAt: now.toISOString(),
  });
}
