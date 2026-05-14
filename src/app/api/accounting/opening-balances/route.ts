/**
 * Opening Balances API
 * ══════════════════════════════════════════════════════════════════════════════
 * POST /api/accounting/opening-balances  — import opening balances
 * GET  /api/accounting/opening-balances?tenantId=X  — view imported balances
 *
 * يُستخدم عند الانتقال من النظام القديم:
 *   1. رفع أرصدة افتتاحية لكل حساب (Dr/Cr)
 *   2. التحقق من التوازن (Debit = Credit)
 *   3. ترحيل قيد افتتاحي واحد بتاريخ بداية الفترة
 *
 * الاستيراد يدعم:
 *   - JSON مباشر (مصفوفة من { accountCode, debit, credit })
 *   - يُعيد تقرير توازن قبل الترحيل
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.opening-balances' });

// ─── Schema ───────────────────────────────────────────────────────────────────

const OpeningBalanceLine = z.object({
  accountCode:  z.string().min(1),
  accountName:  z.string().optional(),
  debit:        z.number().min(0).default(0),
  credit:       z.number().min(0).default(0),
});

const OpeningBalancesSchema = z.object({
  tenantId:     z.string(),
  fiscalYearId: z.number().int().positive(),
  asOfDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format: YYYY-MM-DD'),
  userId:       z.number().int().positive().or(z.string()).transform(Number),
  dryRun:       z.boolean().optional().default(false),
  lines:        z.array(OpeningBalanceLine).min(1).max(5000),
});

type LineInput = z.infer<typeof OpeningBalanceLine>;

// ─── GET ─────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const p         = getPrisma(req as any) as any;

  // Find the opening journal entry
  const journals = await p.journalEntry?.findMany?.({
    where: {
      tenantId,
      reference: { startsWith: 'OB-' },
    },
    include: {
      lines: {
        include: { account: { select: { code: true, nameEn: true, name: true } } },
        orderBy: { account: { code: 'asc' } },
      },
    },
    orderBy: { date: 'desc' },
    take: 5,
  }).catch(() => []) ?? [];

  if (journals.length === 0) {
    return NextResponse.json({
      tenantId,
      message: 'لا توجد أرصدة افتتاحية مُسجَّلة',
      journals: [],
    });
  }

  return NextResponse.json({ tenantId, journals });
}

// ─── POST ────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const body = await req.json();
  const p    = body as z.infer<typeof OpeningBalancesSchema>;

  const parsed = OpeningBalancesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { tenantId, fiscalYearId, asOfDate, userId, dryRun, lines } = parsed.data;
  const prismaClient = getPrisma(req as any) as any;

  // ── Validate each account exists ───────────────────────────────────────────
  const accountCodes = [...new Set(lines.map(l => l.accountCode))];
  const accounts     = await prismaClient.account?.findMany?.({
    where: { tenantId, code: { in: accountCodes } },
    select: { id: true, code: true, nameEn: true, name: true },
  }).catch(() => []) ?? [];

  const accountMap = new Map<string, { id: number; code: string; name: string }>(
    accounts.map((a: any) => [a.code, { id: a.id, code: a.code, name: a.name ?? a.nameEn ?? a.code }]),
  );

  const missingCodes = accountCodes.filter(c => !accountMap.has(c));
  if (missingCodes.length > 0) {
    return NextResponse.json({
      error:   'حسابات غير موجودة في دليل الحسابات',
      missing: missingCodes,
    }, { status: 422 });
  }

  // ── Calculate totals & validate balance ────────────────────────────────────
  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.01;

  const validationReport = {
    totalDebit:  Math.round(totalDebit  * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    difference:  Math.round(diff        * 100) / 100,
    isBalanced,
    lineCount:   lines.length,
    accountCount: accountCodes.length,
  };

  if (!isBalanced) {
    return NextResponse.json({
      error:            'الأرصدة الافتتاحية غير متوازنة',
      validation:       validationReport,
      hint:             'تأكد أن مجموع المدين = مجموع الدائن قبل الترحيل',
    }, { status: 422 });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun:     true,
      message:    '✅ التحقق نجح — الأرصدة متوازنة. أزل dryRun=true للترحيل الفعلي',
      validation: validationReport,
      preview:    lines.slice(0, 10).map(l => ({
        code:  l.accountCode,
        name:  accountMap.get(l.accountCode)?.name,
        debit: l.debit,
        credit: l.credit,
      })),
    });
  }

  // ── Post opening balance journal entry ─────────────────────────────────────
  const journalLines = lines
    .filter(l => l.debit > 0 || l.credit > 0)
    .flatMap((l): any[] => {
      const acct = accountMap.get(l.accountCode)!;
      const entries: any[] = [];
      if (l.debit  > 0) entries.push({ tenantId, accountId: acct.id, side: 'DEBIT',  amount: l.debit,  description: `رصيد افتتاحي — ${acct.name}` });
      if (l.credit > 0) entries.push({ tenantId, accountId: acct.id, side: 'CREDIT', amount: l.credit, description: `رصيد افتتاحي — ${acct.name}` });
      return entries;
    });

  const journal = await prismaClient.journalEntry?.create?.({
    data: {
      tenantId,
      fiscalYearId,
      date:        asOfDate,
      description: 'أرصدة افتتاحية — Opening Balances',
      reference:   `OB-${fiscalYearId}-${asOfDate}`,
      status:      'POSTED',
      createdBy:   String(userId),
      totalDebit:  totalDebit,
      totalCredit: totalCredit,
      lines: { create: journalLines },
    },
    select: { id: true, reference: true, date: true, totalDebit: true },
  }).catch((e: any) => {
    log.error('Failed to post opening balances', { error: e.message });
    throw e;
  });

  log.info('Opening balances posted', {
    tenantId, journalId: journal?.id, lines: journalLines.length,
    totalDebit: Math.round(totalDebit),
  });

  return NextResponse.json({
    success:    true,
    journalId:  journal?.id,
    reference:  journal?.reference,
    validation: validationReport,
    message:    `✅ تم ترحيل ${lines.length} سطر افتتاحي بنجاح`,
  }, { status: 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin', 'accountant', 'CFO'] });
