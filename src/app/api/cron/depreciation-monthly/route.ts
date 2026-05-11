/**
 * Monthly Depreciation Cron Job
 * POST /api/cron/depreciation-monthly
 *
 * يُشغَّل يوم 1 من كل شهر الساعة 3 صباحاً
 * يحسب ويُرحِّل قيود إهلاك الأصول الثابتة (IAS 16) لجميع المستأجرين
 *
 * - يجلب كل المستأجرين النشطين
 * - يُشغِّل DepreciationEngine.runMonthly لكل مستأجر
 * - يُرسل تقرير Telegram للنتائج
 */

import { NextRequest, NextResponse } from 'next/server';
import { DepreciationEngine } from '@/lib/depreciation-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.depreciation-monthly' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun  = searchParams.get('dryRun') === 'true';
  const now     = new Date();
  // Run for PREVIOUS month (this cron fires on day 1, so we want last month)
  const target  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period  = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;

  // Override period if supplied (for manual retrigger)
  const periodOverride = searchParams.get('period');
  const runPeriod = periodOverride ?? period;

  log.info('Depreciation monthly cron started', { period: runPeriod, dryRun });

  // Get all active tenants
  const tenants = await (prisma as any).tenant?.findMany?.({
    where: { isActive: true },
    select: { id: true, code: true },
  }).catch(() => []) ?? [];

  // If no tenant table, run for a single default tenant
  const tenantList = tenants.length > 0
    ? tenants.map((t: any) => ({ id: String(t.id ?? t.code), code: t.code ?? t.id }))
    : [{ id: 'default', code: 'DEFAULT' }];

  const results: {
    tenantId: string;
    period: string;
    totalAssets: number;
    totalCharge: number;
    posted: boolean;
    error?: string;
  }[] = [];

  let grandTotalCharge = 0;
  let totalPosted = 0;

  for (const tenant of tenantList) {
    try {
      // Get current fiscal year for this tenant
      const fy = await (prisma as any).fiscalYear?.findFirst?.({
        where: { tenantId: tenant.id, isCurrent: true },
        select: { id: true },
      }).catch(() => null);

      const fiscalYearId = fy?.id ?? 1;

      const result = await DepreciationEngine.runMonthly(
        tenant.id,
        runPeriod,
        'CRON',
        fiscalYearId,
        dryRun,
      );

      results.push({
        tenantId:    tenant.id,
        period:      runPeriod,
        totalAssets: result.totalAssets,
        totalCharge: result.totalCharge,
        posted:      result.posted,
      });

      grandTotalCharge += result.totalCharge;
      if (result.posted) totalPosted++;

    } catch (e: any) {
      log.error('Depreciation failed for tenant', { tenantId: tenant.id, error: e.message });
      results.push({
        tenantId:    tenant.id,
        period:      runPeriod,
        totalAssets: 0,
        totalCharge: 0,
        posted:      false,
        error:       e.message,
      });
    }
  }

  // Telegram summary
  await notifyTelegram({
    period:           runPeriod,
    tenantsProcessed: tenantList.length,
    totalPosted,
    grandTotalCharge: Math.round(grandTotalCharge * 100) / 100,
    dryRun,
    errors:           results.filter(r => r.error).length,
  });

  log.info('Depreciation monthly cron complete', {
    period: runPeriod,
    tenants: tenantList.length,
    totalCharge: Math.round(grandTotalCharge),
    posted: totalPosted,
  });

  return NextResponse.json({
    period:           runPeriod,
    dryRun,
    tenantsProcessed: tenantList.length,
    totalPosted,
    grandTotalCharge: Math.round(grandTotalCharge * 100) / 100,
    results,
    generatedAt:      now.toISOString(),
  });
}

async function notifyTelegram(data: {
  period: string; tenantsProcessed: number; totalPosted: number;
  grandTotalCharge: number; dryRun: boolean; errors: number;
}) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const icon = data.errors > 0 ? '⚠️' : '✅';
  const msg  = [
    `${icon} *إهلاك الأصول الثابتة — ${data.period}*`,
    `📊 المستأجرون: ${data.tenantsProcessed}`,
    `✅ تم الترحيل: ${data.totalPosted}`,
    `💰 إجمالي الإهلاك: ${data.grandTotalCharge.toLocaleString('ar-SA')} ر.س`,
    data.errors > 0 ? `❌ أخطاء: ${data.errors}` : '',
    data.dryRun ? `🔍 تشغيل تجريبي — لم يُرحَّل` : '',
  ].filter(Boolean).join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
  }).catch(() => null);
}
