/**
 * Monthly Payroll GL Auto-Post Cron
 * POST /api/cron/payroll-monthly
 *
 * يُشغَّل يوم 28 من كل شهر الساعة 4 صباحاً
 * بعد اعتماد كشف الرواتب، يُرحِّل قيد GL لجميع المستأجرين تلقائياً
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.payroll-monthly' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun  = searchParams.get('dryRun') === 'true';
  const now     = new Date();
  // Run for CURRENT month (payroll is processed same month)
  const period  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const periodOverride = searchParams.get('period');
  const runPeriod = periodOverride ?? period;

  log.info('Payroll monthly cron started', { period: runPeriod, dryRun });

  const p = prisma as any;
  const tenants = await p.tenant?.findMany?.({
    where: { isActive: true },
    select: { id: true, code: true },
  }).catch(() => []) ?? [{ id: 'default', code: 'DEFAULT' }];

  const results: {
    tenantId: string;
    period:   string;
    posted:   boolean;
    journalId?: number;
    gross?:   number;
    error?:   string;
  }[] = [];

  let totalPosted = 0;

  for (const tenant of tenants) {
    const tenantId = String(tenant.id ?? tenant.code);
    try {
      // Call the payroll-gl endpoint internally
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/accounting/payroll-gl`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.JWT_SECRET ?? ''}`,
          'x-cron-secret': CRON_SECRET,
        },
        body: JSON.stringify({
          tenantId,
          period:       runPeriod,
          fiscalYearId: 1,
          userId:       0,
          dryRun,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        results.push({
          tenantId,
          period:    runPeriod,
          posted:    !dryRun,
          journalId: data.journalId,
          gross:     data.summary?.totalGross,
        });
        if (!dryRun) totalPosted++;
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        results.push({ tenantId, period: runPeriod, posted: false, error: err.error ?? String(res.status) });
      }
    } catch (e: any) {
      log.error('Payroll GL posting failed', { tenantId, error: e.message });
      results.push({ tenantId, period: runPeriod, posted: false, error: e.message });
    }
  }

  // Telegram
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (token && chatId) {
    const errors = results.filter(r => r.error).length;
    const msg = [
      `${errors > 0 ? '⚠️' : '✅'} *قيد رواتب شهر ${runPeriod}*`,
      `📊 المستأجرون: ${tenants.length}`,
      `✅ تم الترحيل: ${totalPosted}`,
      errors > 0 ? `❌ أخطاء: ${errors}` : '',
      dryRun ? `🔍 تجريبي — لم يُرحَّل` : '',
    ].filter(Boolean).join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }

  log.info('Payroll monthly cron complete', { period: runPeriod, posted: totalPosted });

  return NextResponse.json({
    period: runPeriod,
    dryRun,
    tenantsProcessed: tenants.length,
    totalPosted,
    errors: results.filter(r => r.error).length,
    results,
    generatedAt: now.toISOString(),
  });
}
