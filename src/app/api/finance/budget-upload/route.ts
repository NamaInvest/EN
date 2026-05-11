/**
 * Budget Annual Upload API
 * POST /api/finance/budget-upload  — bulk import annual budget by account
 * GET  /api/finance/budget-upload?tenantId=X&fiscalYear=2025
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.budget-upload' });
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
type Month = typeof MONTHS[number];

const LineSchema = z.object({
  accountCode: z.string().min(1),
  annualTotal: z.number().optional(),
  jan: z.number().default(0), feb: z.number().default(0), mar: z.number().default(0),
  apr: z.number().default(0), may: z.number().default(0), jun: z.number().default(0),
  jul: z.number().default(0), aug: z.number().default(0), sep: z.number().default(0),
  oct: z.number().default(0), nov: z.number().default(0), dec: z.number().default(0),
});

const UploadSchema = z.object({
  tenantId:   z.string(),
  fiscalYear: z.number().int().min(2020).max(2050),
  userId:     z.number().int().positive().or(z.string()).transform(Number),
  dryRun:     z.boolean().optional().default(false),
  lines:      z.array(LineSchema).min(1).max(2000),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId   = searchParams.get('tenantId') ?? 'default';
  const fiscalYear = parseInt(searchParams.get('fiscalYear') ?? String(new Date().getFullYear()));
  const p = getPrisma(req as any) as any;

  const lines = await p.budgetLine?.findMany?.({
    where: { tenantId, fiscalYear },
    orderBy: { accountCode: 'asc' },
  }).catch(() => []) ?? [];

  const grandTotal = lines.reduce((s: number, l: any) =>
    s + MONTHS.reduce((ms, m) => ms + Number(l[m] ?? 0), 0), 0);

  return NextResponse.json({ tenantId, fiscalYear, lineCount: lines.length, lines, grandTotal: Math.round(grandTotal * 100) / 100 });
}

async function _POST(req: NextRequest) {
  const body = await req.json();
  const parsed = UploadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { tenantId, fiscalYear, userId, dryRun, lines } = parsed.data;
  const p = getPrisma(req as any) as any;

  const codes = [...new Set(lines.map(l => l.accountCode))];
  const accounts = await p.account?.findMany?.({ where: { tenantId, code: { in: codes } }, select: { id: true, code: true } }).catch(() => []) ?? [];
  const accountMap = new Map<string, number>(accounts.map((a: any) => [a.code, a.id]));
  const missingCodes = codes.filter(c => !accountMap.has(c));

  const processedLines = lines.map(line => {
    const monthlySum = MONTHS.reduce((s, m) => s + (line[m] ?? 0), 0);
    if (line.annualTotal && monthlySum < 0.01) {
      const monthly = line.annualTotal / 12;
      const dist = MONTHS.reduce((a, m) => ({ ...a, [m]: Math.round(monthly * 100) / 100 }), {} as Record<Month, number>);
      return { ...line, ...dist, annualTotal: line.annualTotal };
    }
    return { ...line, annualTotal: line.annualTotal ?? monthlySum };
  });

  const grandTotal = processedLines.reduce((s, l) => s + (l.annualTotal ?? 0), 0);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      message: missingCodes.length > 0 ? `⚠️ ${missingCodes.length} حساب غير موجود` : `✅ ${processedLines.length} سطر جاهزة`,
      missingAccounts: missingCodes,
      grandTotal: Math.round(grandTotal * 100) / 100,
    });
  }

  let saved = 0;
  for (const line of processedLines.filter(l => accountMap.has(l.accountCode))) {
    const months = MONTHS.reduce((a, m) => ({ ...a, [m]: line[m] ?? 0 }), {} as Record<Month, number>);
    await p.budgetLine?.upsert?.({
      where: { tenantId_fiscalYear_accountCode: { tenantId, fiscalYear, accountCode: line.accountCode } },
      create: { tenantId, fiscalYear, accountCode: line.accountCode, accountId: accountMap.get(line.accountCode), annualTotal: line.annualTotal ?? 0, createdBy: String(userId), ...months },
      update: { annualTotal: line.annualTotal ?? 0, updatedBy: String(userId), ...months },
    }).catch(() => null) && saved++;
  }

  log.info('Budget uploaded', { tenantId, fiscalYear, saved });
  return NextResponse.json({ success: saved > 0, saved, message: `✅ تم حفظ ${saved} سطر للسنة ${fiscalYear}` }, { status: 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
