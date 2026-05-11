/**
 * Prepayments Monthly Amortization Cron
 * POST /api/cron/prepayments-amortization
 * Schedule: 0 5 1 * *  (day 1 of each month at 5 AM)
 *
 * يُنفِّذ استهلاك المدفوعات المقدمة تلقائياً كل أول الشهر:
 *   لكل AccrualEntry نشط (type=PREPAYMENT, remainingMonths > 0):
 *     1. يُنشئ قيد: Dr Expense / Cr Prepaid Asset
 *     2. يُقلِّل remainingMonths بـ 1
 *     3. إذا بلغ صفراً → status = COMPLETED
 *     4. يُسجِّل في PrepaymentSchedule
 *
 * يُرسل تقريراً لـ Telegram بعدد القيود وإجمالي المبلغ
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log  = logger.child({ service: 'cron.prepayments-amortization' });
const CRON = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? req.headers.get('x-cron-secret');
  if (auth !== CRON && auth !== `Bearer ${CRON}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';
  const now    = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const postDate = new Date(now.getFullYear(), now.getMonth(), 28); // always post on 28th

  const p = prisma as any;

  // Fetch all active prepayment entries with remaining months
  const entries = await p.accrualEntry?.findMany?.({
    where: {
      type:           'PREPAYMENT',
      status:         'ACTIVE',
      remainingMonths: { gt: 0 },
    },
    include: { tenant: { select: { id: true } } },
  }).catch(() => []) ?? [];

  const results: {
    id:          number;
    tenantId:    string;
    description: string;
    monthly:     number;
    remaining:   number;
    journalId?:  number;
    completed:   boolean;
  }[] = [];

  let totalAmortized = 0;
  let completedCount = 0;

  for (const entry of entries) {
    const monthly   = Number(entry.monthlyAmount ?? 0);
    const remaining = (entry.remainingMonths ?? 0) - 1;
    const completed = remaining <= 0;

    if (!dryRun) {
      // Get fiscal year for this tenant
      const fy = await p.fiscalYear?.findFirst?.({
        where: { tenantId: entry.tenantId, status: 'ACTIVE' },
        select: { id: true },
      }).catch(() => null);

      const fiscalYearId = fy?.id ?? 1;

      // Post journal: Dr Expense / Cr Prepaid Asset
      const journal = entry.expenseAccountId && entry.accrualAccountId
        ? await p.journalEntry?.create?.({
            data: {
              tenantId:    entry.tenantId,
              fiscalYearId,
              date:        postDate,
              description: `إهلاك مدفوع مقدماً: ${entry.description} — ${period}`,
              reference:   `${entry.reference ?? 'PRE'}-AMR-${period}`,
              status:      'POSTED',
              totalDebit:  monthly,
              totalCredit: monthly,
              createdBy:   'SYSTEM_CRON',
              lines: {
                create: [
                  { tenantId: entry.tenantId, accountId: entry.expenseAccountId, side: 'DEBIT',  amount: monthly, description: `إهلاك: ${entry.description}` },
                  { tenantId: entry.tenantId, accountId: entry.accrualAccountId, side: 'CREDIT', amount: monthly, description: `إهلاك: ${entry.description}` },
                ],
              },
            },
            select: { id: true },
          }).catch(() => null)
        : null;

      // Update AccrualEntry: decrement remainingMonths, maybe mark COMPLETED
      await p.accrualEntry?.update?.({
        where: { id: entry.id },
        data: {
          remainingMonths: remaining,
          status:          completed ? 'COMPLETED' : 'ACTIVE',
          updatedAt:       now,
        },
      }).catch(() => null);

      // Log to PrepaymentSchedule
      await p.prepaymentSchedule?.create?.({
        data: {
          tenantId:      entry.tenantId,
          accrualEntryId:entry.id,
          period,
          monthlyAmount: monthly,
          journalEntryId:journal?.id ?? null,
          status:        'POSTED',
          postedAt:      now,
        },
      }).catch(() => null);

      results.push({
        id:          entry.id,
        tenantId:    entry.tenantId,
        description: entry.description,
        monthly,
        remaining,
        journalId:   journal?.id,
        completed,
      });
    } else {
      results.push({ id: entry.id, tenantId: entry.tenantId, description: entry.description, monthly, remaining, completed });
    }

    totalAmortized += monthly;
    if (completed) completedCount++;
  }

  // Telegram report
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (token && chatId && !dryRun && results.length > 0) {
    const msg = [
      `📋 *استهلاك المدفوعات المقدمة الشهري*`,
      `📅 الفترة: ${period}`,
      `🔢 القيود المُرحَّلة: ${results.length}`,
      `💰 إجمالي الاستهلاك: ${totalAmortized.toLocaleString('ar-SA')} ر.س`,
      `✅ مكتملة هذا الشهر: ${completedCount}`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }

  log.info('Prepayments amortization cron', { period, count: results.length, totalAmortized, dryRun });

  return NextResponse.json({
    dryRun, period, postDate: postDate.toISOString().split('T')[0],
    processed:     results.length,
    completedCount,
    totalAmortized: Math.round(totalAmortized * 100) / 100,
    results,
    message: `${dryRun ? '📋 تجريبي:' : '✅'} تم استهلاك ${results.length} مدفوع مقدم — إجمالي: ${Math.round(totalAmortized * 100) / 100} ر.س`,
  });
}
