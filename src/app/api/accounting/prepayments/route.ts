/**
 * Prepayments Route — يُعيد توجيه إلى accruals بنوع PREPAYMENT
 * GET  /api/accounting/prepayments?tenantId=X&period=YYYY-MM
 * POST /api/accounting/prepayments  (نفس schema بـ accruals)
 *
 * يُوزِّع المدفوعات المقدمة شهرياً:
 *   Booking:       Dr. Prepaid Asset (1xxx) / Cr. Cash (1010)
 *   Amortization:  Dr. Expense (6xxx)       / Cr. Prepaid Asset (1xxx)
 *
 * يُرسل للمستخدم قائمة الجدول الشهري مع المبلغ المتبقي لكل دفعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.prepayments' });

const PostSchema = z.object({
  tenantId:     z.string(),
  period:       z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM'),
  fiscalYearId: z.number().int().positive(),
  userId:       z.number().int().positive().or(z.string()).transform(Number),
  dryRun:       z.boolean().optional().default(false),
  prepayments: z.array(z.object({
    description:      z.string().min(1),
    totalAmount:      z.number().positive(),
    months:           z.number().int().min(1).max(120),
    prepaidAccountId: z.number().int().positive(),  // 1xxx Prepaid Asset
    expenseAccountId: z.number().int().positive(),  // 6xxx Expense
    cashAccountId:    z.number().int().positive().optional(), // 1010 Cash
    startDate:        z.string().optional(),
    reference:        z.string().optional(),
  })).min(1).max(200),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period');
  const status   = searchParams.get('status') ?? 'ACTIVE';
  const p        = getPrisma(req as any) as any;

  const where: any = { tenantId, type: 'PREPAYMENT' };
  if (period) where.period = period;
  if (status !== 'ALL') where.status = status;

  const entries = await p.accrualEntry?.findMany?.({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
  }).catch(() => []) ?? [];

  // For each entry, build amortization schedule
  const enriched = entries.map((e: any) => {
    const monthly = Math.round((Number(e.amount ?? 0) / (e.months ?? 1)) * 100) / 100;
    const posted  = (e.months ?? 1) - (e.remainingMonths ?? 0);
    const remaining = Math.round((e.remainingMonths ?? 0) * monthly * 100) / 100;
    return { ...e, monthlyAmount: monthly, postedMonths: posted, remainingBalance: remaining };
  });

  const summary = {
    totalEntries:   enriched.length,
    totalPrepaid:   Math.round(enriched.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0) * 100) / 100,
    totalRemaining: Math.round(enriched.reduce((s: number, e: any) => s + e.remainingBalance, 0) * 100) / 100,
    active:  enriched.filter((e: any) => e.status === 'ACTIVE').length,
  };

  return NextResponse.json({ tenantId, period, status, summary, prepayments: enriched });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { tenantId, period, fiscalYearId, userId, dryRun, prepayments } = parsed.data;
  const p = getPrisma(req as any) as any;

  const [year, month] = period.split('-').map(Number);
  const postDate      = new Date(year, month - 1, 28);

  const results: {
    description:  string;
    totalAmount:  number;
    monthlyAmount:number;
    months:       number;
    journalId?:   number;
    reference:    string;
    schedule:     { period: string; amount: number }[];
  }[] = [];

  for (const pre of prepayments) {
    const monthly  = Math.round((pre.totalAmount / pre.months) * 100) / 100;
    const ref      = pre.reference ?? `PRE-${period}-FY${fiscalYearId}-${results.length + 1}`;

    // Build booking journal: Dr Prepaid / Cr Cash
    const bookingLines = [
      { accountId: pre.prepaidAccountId, side: 'DEBIT',  amount: pre.totalAmount, description: `مدفوع مقدماً: ${pre.description}` },
      ...(pre.cashAccountId ? [{ accountId: pre.cashAccountId, side: 'CREDIT', amount: pre.totalAmount, description: `دفع مقدم: ${pre.description}` }] : []),
    ];

    // Build first-month amortization: Dr Expense / Cr Prepaid
    const amortLines = [
      { accountId: pre.expenseAccountId, side: 'DEBIT',  amount: monthly, description: `إهلاك مدفوع مقدماً: ${pre.description} — ${period}` },
      { accountId: pre.prepaidAccountId, side: 'CREDIT', amount: monthly, description: `إهلاك مدفوع مقدماً: ${pre.description} — ${period}` },
    ];

    // Generate schedule
    const schedule = Array.from({ length: pre.months }, (_, i) => {
      const d = new Date(year, month - 1 + i, 1);
      return { period: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, amount: monthly };
    });

    if (dryRun) {
      results.push({ description: pre.description, totalAmount: pre.totalAmount, monthlyAmount: monthly, months: pre.months, reference: ref, schedule });
      continue;
    }

    // Create booking journal
    const journal = await p.journalEntry?.create?.({
      data: {
        tenantId, fiscalYearId, date: postDate,
        description: `مدفوع مقدماً: ${pre.description}`,
        reference: ref, status: 'POSTED',
        totalDebit: pre.totalAmount, totalCredit: pre.totalAmount,
        createdBy: String(userId),
        lines: { create: bookingLines.map(l => ({ tenantId, ...l })) },
      },
      select: { id: true },
    }).catch(() => null);

    // Save to AccrualEntry
    await p.accrualEntry?.create?.({
      data: {
        tenantId, type: 'PREPAYMENT', period,
        description: pre.description, amount: pre.totalAmount,
        monthlyAmount: monthly, months: pre.months,
        remainingMonths: pre.months - 1,
        expenseAccountId: pre.expenseAccountId,
        accrualAccountId: pre.prepaidAccountId,
        journalEntryId: journal?.id, reference: ref, status: 'ACTIVE',
        createdBy: String(userId),
      },
    }).catch(() => null);

    // Post first amortization
    await p.journalEntry?.create?.({
      data: {
        tenantId, fiscalYearId, date: postDate,
        description: `إهلاك شهر ${period}: ${pre.description}`,
        reference: `${ref}-AMR-${period}`, status: 'POSTED',
        totalDebit: monthly, totalCredit: monthly,
        createdBy: String(userId),
        lines: { create: amortLines.map(l => ({ tenantId, ...l })) },
      },
    }).catch(() => null);

    results.push({ description: pre.description, totalAmount: pre.totalAmount, monthlyAmount: monthly, months: pre.months, journalId: journal?.id, reference: ref, schedule });
  }

  log.info('Prepayments posted', { tenantId, period, count: prepayments.length, dryRun });

  return NextResponse.json({
    dryRun, period, tenantId,
    processed: results.length,
    totalPrepaid: Math.round(results.reduce((s, r) => s + r.totalAmount, 0) * 100) / 100,
    results,
    message: `${dryRun ? '📋 تجريبي:' : '✅'} تم معالجة ${results.length} دفعة مقدمة`,
  }, { status: dryRun ? 200 : 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','accountant','CFO'] });
