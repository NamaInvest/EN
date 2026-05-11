/**
 * Payroll-to-GL Auto-Post API
 * ══════════════════════════════════════════════════════════════════════════════
 * POST /api/accounting/payroll-gl
 *
 * يُرحِّل قيد الرواتب تلقائياً من كشف الرواتب المعتمد إلى دفتر الأستاذ:
 *
 *   Dr. مصروف الرواتب   (حسابات التشغيل 6xxx)
 *   Dr. مصروف GOSI       (نصيب صاحب العمل)
 *   Cr. ذمم الموظفين     (مستحقات الرواتب 2xxx)
 *   Cr. GOSI مستحقة      (2xxx)
 *   Cr. اقتطاعات الموظف  (GOSI + ضريبة + سلف)
 *
 * يُسمى القيد: PAYROLL-{period}-{fiscalYearId}
 * يدعم dry-run للمراجعة قبل الترحيل
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.payroll-gl' });

const Schema = z.object({
  tenantId:     z.string(),
  period:       z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM'),
  fiscalYearId: z.number().int().positive(),
  userId:       z.number().int().positive().or(z.string()).transform(Number),
  dryRun:       z.boolean().optional().default(false),
  // Account overrides (falls back to system defaults if not provided)
  salaryExpenseAccountId: z.number().int().positive().optional(),
  gosiExpenseAccountId:   z.number().int().positive().optional(),
  salaryPayableAccountId: z.number().int().positive().optional(),
  gosiPayableAccountId:   z.number().int().positive().optional(),
  deductionAccountId:     z.number().int().positive().optional(),
});

// Default GL accounts (standard Saudi Chart of Accounts)
const DEFAULTS = {
  salaryExpense:  '6010', // مصروف الرواتب والأجور
  gosiExpense:    '6020', // مصروف GOSI (نصيب صاحب العمل)
  salaryPayable:  '2110', // رواتب مستحقة الدفع
  gosiPayable:    '2120', // GOSI مستحقة
  deductions:     '2130', // اقتطاعات الموظفين
};

async function getAccountId(p: any, tenantId: string, code: string, override?: number): Promise<number | null> {
  if (override) return override;
  const acct = await p.account?.findFirst?.({
    where: { tenantId, code },
    select: { id: true },
  }).catch(() => null);
  return acct?.id ?? null;
}

async function _POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const {
    tenantId, period, fiscalYearId, userId, dryRun,
    salaryExpenseAccountId, gosiExpenseAccountId,
    salaryPayableAccountId, gosiPayableAccountId, deductionAccountId,
  } = parsed.data;

  const p = getPrisma(req as any) as any;

  // ── Check if already posted ───────────────────────────────────────────────
  const existingJournal = await p.journalEntry?.findFirst?.({
    where: { tenantId, reference: { startsWith: `PAYROLL-${period}` }, status: 'POSTED' },
    select: { id: true, reference: true },
  }).catch(() => null);

  if (existingJournal) {
    return NextResponse.json({
      error:     `قيد الرواتب للفترة ${period} مُرحَّل مسبقاً`,
      journalId: existingJournal.id,
      reference: existingJournal.reference,
    }, { status: 409 });
  }

  // ── Fetch approved payroll run for this period ────────────────────────────
  const payrollRun = await p.payrollRun?.findFirst?.({
    where: { tenantId, period, status: { in: ['APPROVED', 'POSTED'] } },
    include: {
      payslips: {
        where: { status: { not: 'CANCELLED' } },
        select: {
          grossSalary: true, netSalary: true,
          gosiEmployee: true, gosiEmployer: true,
          incomeTax: true, advanceDeduction: true,
          otherDeductions: true,
        },
      },
    },
  }).catch(() => null);

  // Fallback: try payrollPeriod or payrollBatch
  const payrollData = payrollRun ?? await p.payrollPeriod?.findFirst?.({
    where: { tenantId, period, status: 'APPROVED' },
    select: { id: true, totalGross: true, totalNet: true, totalGosiEmployee: true, totalGosiEmployer: true, totalDeductions: true },
  }).catch(() => null);

  if (!payrollData) {
    return NextResponse.json({
      error:  `لا يوجد كشف رواتب معتمد للفترة ${period}`,
      period,
      hint:   'تأكد من اعتماد كشف الرواتب أولاً',
    }, { status: 422 });
  }

  // ── Aggregate payroll amounts ────────────────────────────────────────────
  let totalGross    = 0;
  let totalNet      = 0;
  let gosiEmployee  = 0;
  let gosiEmployer  = 0;
  let otherDeductions = 0;

  if (payrollRun?.payslips?.length > 0) {
    for (const slip of payrollRun.payslips) {
      totalGross       += Number(slip.grossSalary    ?? 0);
      totalNet         += Number(slip.netSalary      ?? 0);
      gosiEmployee     += Number(slip.gosiEmployee   ?? 0);
      gosiEmployer     += Number(slip.gosiEmployer   ?? 0);
      otherDeductions  += Number(slip.incomeTax      ?? 0)
                       +  Number(slip.advanceDeduction ?? 0)
                       +  Number(slip.otherDeductions ?? 0);
    }
  } else {
    // Use aggregate totals if individual slips not available
    totalGross      = Number(payrollData.totalGross       ?? 0);
    totalNet        = Number(payrollData.totalNet         ?? 0);
    gosiEmployee    = Number(payrollData.totalGosiEmployee ?? 0);
    gosiEmployer    = Number(payrollData.totalGosiEmployer ?? 0);
    otherDeductions = Number(payrollData.totalDeductions  ?? 0) - gosiEmployee;
  }

  const totalDeductions = gosiEmployee + otherDeductions;

  // ── Resolve GL account IDs ────────────────────────────────────────────────
  const [
    salaryExpId, gosiExpId, salaryPayId, gosiPayId, dedId,
  ] = await Promise.all([
    getAccountId(p, tenantId, DEFAULTS.salaryExpense,  salaryExpenseAccountId),
    getAccountId(p, tenantId, DEFAULTS.gosiExpense,    gosiExpenseAccountId),
    getAccountId(p, tenantId, DEFAULTS.salaryPayable,  salaryPayableAccountId),
    getAccountId(p, tenantId, DEFAULTS.gosiPayable,    gosiPayableAccountId),
    getAccountId(p, tenantId, DEFAULTS.deductions,     deductionAccountId),
  ]);

  // Build journal lines
  // Dr Salary Expense (total gross)
  // Dr GOSI Expense   (employer share)
  // Cr Salary Payable (net payable to employees)
  // Cr GOSI Payable   (employee + employer GOSI)
  // Cr Deductions     (income tax + advances + other)

  const totalGosiPayable = gosiEmployee + gosiEmployer;

  const journalLines = [
    { accountId: salaryExpId, accountCode: DEFAULTS.salaryExpense, side: 'DEBIT',  amount: Math.round(totalGross   * 100) / 100, description: `مصروف الرواتب — ${period}` },
    { accountId: gosiExpId,   accountCode: DEFAULTS.gosiExpense,   side: 'DEBIT',  amount: Math.round(gosiEmployer * 100) / 100, description: `GOSI صاحب العمل — ${period}` },
    { accountId: salaryPayId, accountCode: DEFAULTS.salaryPayable, side: 'CREDIT', amount: Math.round(totalNet     * 100) / 100, description: `رواتب مستحقة الدفع — ${period}` },
    { accountId: gosiPayId,   accountCode: DEFAULTS.gosiPayable,   side: 'CREDIT', amount: Math.round(totalGosiPayable * 100) / 100, description: `GOSI مستحقة — ${period}` },
    ...(totalDeductions > 0.01 ? [{ accountId: dedId, accountCode: DEFAULTS.deductions, side: 'CREDIT', amount: Math.round(totalDeductions * 100) / 100, description: `اقتطاعات الموظفين — ${period}` }] : []),
  ].filter((l): l is typeof l & { accountId: number } => l.accountId != null);

  const totalDebit  = journalLines.filter(l => l.side === 'DEBIT').reduce((s, l)  => s + l.amount, 0);
  const totalCredit = journalLines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.02;

  const summary = {
    period,
    totalGross:        Math.round(totalGross        * 100) / 100,
    totalNet:          Math.round(totalNet          * 100) / 100,
    gosiEmployer:      Math.round(gosiEmployer      * 100) / 100,
    gosiEmployee:      Math.round(gosiEmployee      * 100) / 100,
    totalDeductions:   Math.round(totalDeductions   * 100) / 100,
    totalGosiPayable:  Math.round(totalGosiPayable  * 100) / 100,
    journalLinesCount: journalLines.length,
    isBalanced,
    totalDebit:        Math.round(totalDebit   * 100) / 100,
    totalCredit:       Math.round(totalCredit  * 100) / 100,
  };

  if (dryRun || !isBalanced) {
    return NextResponse.json({
      dryRun:  true,
      summary,
      warning: !isBalanced ? `⚠️ القيد غير متوازن (${Math.abs(totalDebit - totalCredit).toFixed(2)} فرق)` : undefined,
      message: isBalanced ? `✅ القيد متوازن — ${journalLines.length} سطر جاهزة للترحيل` : '❌ خطأ في التوازن',
      lines:   journalLines,
    });
  }

  // ── Post journal entry ────────────────────────────────────────────────────
  const [dd, mm] = period.split('-');
  const postDate  = new Date(parseInt(dd), parseInt(mm) - 1, 28); // last business day

  const journal = await p.journalEntry?.create?.({
    data: {
      tenantId,
      fiscalYearId,
      date:        postDate,
      description: `قيد الرواتب — ${period}`,
      reference:   `PAYROLL-${period}-FY${fiscalYearId}`,
      status:      'POSTED',
      totalDebit,
      totalCredit,
      createdBy:   String(userId),
      lines: {
        create: journalLines.map(l => ({
          tenantId,
          accountId:   l.accountId,
          side:        l.side,
          amount:      l.amount,
          description: l.description,
        })),
      },
    },
    select: { id: true, reference: true, date: true, totalDebit: true },
  });

  log.info('Payroll GL journal posted', { tenantId, period, journalId: journal?.id, totalGross: Math.round(totalGross) });

  return NextResponse.json({
    success:   true,
    journalId: journal?.id,
    reference: journal?.reference,
    summary,
    message:   `✅ تم ترحيل قيد رواتب ${period} بنجاح`,
  }, { status: 201 });
}

// GET: check posting status for a period
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period') ?? '';
  const p        = getPrisma(req as any) as any;

  const journals = await p.journalEntry?.findMany?.({
    where: { tenantId, reference: { startsWith: 'PAYROLL-' }, ...(period ? { reference: { contains: period } } : {}) },
    orderBy: { date: 'desc' },
    take: 12,
    select: { id: true, reference: true, date: true, totalDebit: true, status: true },
  }).catch(() => []) ?? [];

  return NextResponse.json({ tenantId, period, journals });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','accountant','CFO','payroll_manager'] });
