/**
 * Accruals & Prepayments API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET  /api/accounting/accruals?tenantId=X&type=accrual|prepayment&period=YYYY-MM
 * POST /api/accounting/accruals  — create/post accrual or prepayment entry
 *
 * Accruals   : مصاريف مستحقة لم تُدفع بعد (e.g. إيجار، رواتب متأخرة)
 * Prepayments: مصاريف دُفعت مسبقاً تُستهلك شهرياً (e.g. تأمين، إيجار مدفوع مقدماً)
 *
 * يُولِّد القيود:
 *   Accrual:    Dr. مصروف  / Cr. مصاريف مستحقة (2xxx)
 *   Prepayment: Dr. مدفوعات مقدماً (1xxx) → يُستهلك Dr. مصروف / Cr. مدفوعات مقدماً
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accruals' });

const Schema = z.object({
  type:         z.enum(['accrual', 'prepayment']),
  tenantId:     z.string(),
  period:       z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM'),
  fiscalYearId: z.number().int().positive(),
  userId:       z.number().int().positive().or(z.string()).transform(Number),
  dryRun:       z.boolean().optional().default(false),
  entries: z.array(z.object({
    description:      z.string().min(1),
    amount:           z.number().positive(),
    expenseAccountId: z.number().int().positive(),
    accrualAccountId: z.number().int().positive(),
    months:           z.number().int().min(1).max(120).optional().default(1),
    startDate:        z.string().optional(),
    reference:        z.string().optional(),
  })).min(1).max(500),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const type     = searchParams.get('type') ?? 'accrual';
  const period   = searchParams.get('period');
  const p        = getPrisma(req as any) as any;

  const where: any = { tenantId, type: type.toUpperCase() };
  if (period) where.period = period;

  const entries = await p.accrualEntry?.findMany?.({
    where,
    orderBy: { period: 'desc' },
    take: 500,
    include: {
      expenseAccount: { select: { code: true, nameEn: true } },
      accrualAccount: { select: { code: true, nameEn: true } },
    },
  }).catch(() => []) ?? [];

  const total = entries.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  return NextResponse.json({ tenantId, type, period, count: entries.length, totalAmount: Math.round(total * 100) / 100, entries });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { type, tenantId, period, fiscalYearId, userId, dryRun, entries } = parsed.data;
  const p = getPrisma(req as any) as any;

  const [year, month] = period.split('-').map(Number);
  const postDate      = new Date(year, month - 1, 28);
  const prefix        = type === 'accrual' ? 'ACR' : 'PRE';
  const reference     = `${prefix}-${period}-FY${fiscalYearId}`;

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);

  const journalLines = entries.flatMap(e => {
    const monthlyAmount = type === 'prepayment' ? Math.round((e.amount / (e.months ?? 1)) * 100) / 100 : e.amount;
    return [
      { accountId: e.expenseAccountId, side: 'DEBIT',  amount: monthlyAmount, description: e.description },
      { accountId: e.accrualAccountId, side: 'CREDIT', amount: monthlyAmount, description: e.description },
    ];
  });

  const totalDebit  = journalLines.filter(l => l.side === 'DEBIT').reduce((s, l)  => s + l.amount, 0);
  const totalCredit = journalLines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.02;

  if (dryRun || !isBalanced) {
    return NextResponse.json({
      dryRun: true, isBalanced, reference,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalDebit:  Math.round(totalDebit  * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      lines: journalLines,
      message: isBalanced ? `✅ ${entries.length} قيد جاهزة` : `❌ القيد غير متوازن`,
    });
  }

  const journal = await p.journalEntry?.create?.({
    data: {
      tenantId, fiscalYearId, date: postDate,
      description: `${type === 'accrual' ? 'مصاريف مستحقة' : 'مدفوعات مقدماً'} — ${period}`,
      reference, status: 'POSTED', totalDebit, totalCredit,
      createdBy: String(userId),
      lines: { create: journalLines.map(l => ({ tenantId, ...l })) },
    },
    select: { id: true, reference: true },
  }).catch(() => null);

  log.info('Accrual journal posted', { tenantId, type, period, journalId: journal?.id });

  return NextResponse.json({
    success: !!journal, journalId: journal?.id, reference,
    totalAmount: Math.round(totalAmount * 100) / 100,
    message: `✅ تم ترحيل ${entries.length} ${type === 'accrual' ? 'مصروف مستحق' : 'مدفوعة مقدماً'}`,
  }, { status: 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','accountant','CFO'] });
