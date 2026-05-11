/**
 * Profit & Loss Statement API
 * GET /api/accounting/profit-loss
 *     ?tenantId=X&from=YYYY-MM-DD&to=YYYY-MM-DD&comparePeriod=YYYY-MM-DD..YYYY-MM-DD&format=json|csv
 *
 * قائمة الدخل الشاملة (SOCPA/IFRS):
 *   - الإيرادات (4xxx)
 *   - تكلفة المبيعات (5xxx)
 *   - مجمل الربح
 *   - المصروفات التشغيلية (6xxx)
 *   - الربح التشغيلي (EBIT)
 *   - الإيرادات/المصروفات الأخرى (7xxx/8xxx)
 *   - صافي الربح قبل/بعد الضريبة
 *   - مقارنة اختيارية بفترة سابقة (YoY / QoQ)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.profit-loss' });

interface PLLine {
  code:    string;
  name:    string;
  amount:  number;
  compare: number | null;
  change:  number | null;
  changePct: string | null;
}

interface PLSection {
  section:  string;
  lines:    PLLine[];
  total:    number;
  compare:  number | null;
}

async function fetchSectionAmounts(
  p: any,
  tenantId: string,
  from: Date,
  to: Date,
  codeFrom: string,
  codeTo: string,
  side: 'DEBIT' | 'CREDIT',
): Promise<{ accountId: number; code: string; nameAr: string; name: string; net: number }[]> {
  const lines = await p.journalEntryLine?.findMany?.({
    where: {
      tenantId,
      account: { code: { gte: codeFrom, lt: codeTo } },
      journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' },
    },
    select: {
      side: true, amount: true,
      account: { select: { id: true, code: true, nameAr: true, name: true } },
    },
  }).catch(() => []) ?? [];

  const map = new Map<number, { code: string; nameAr: string; name: string; net: number }>();
  for (const l of lines) {
    const acct  = l.account;
    const entry = map.get(acct.id) ?? { code: acct.code, nameAr: acct.nameAr ?? acct.name, name: acct.name, net: 0 };
    const amt   = Number(l.amount ?? 0);
    entry.net  += (l.side === side ? amt : -amt);
    map.set(acct.id, entry);
  }

  return Array.from(map.entries()).map(([id, v]) => ({ accountId: id, ...v }));
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId     = searchParams.get('tenantId') ?? 'default';
  const format       = (searchParams.get('format') ?? 'json') as 'json' | 'csv';
  const now          = new Date();
  const from         = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(now.getFullYear(), 0, 1);
  const to           = searchParams.get('to')   ? new Date(searchParams.get('to')! + 'T23:59:59') : now;

  // Compare period (e.g. prior year)
  const compareFrom  = searchParams.get('compareFrom') ? new Date(searchParams.get('compareFrom')!) : null;
  const compareTo    = searchParams.get('compareTo')   ? new Date(searchParams.get('compareTo')! + 'T23:59:59') : null;
  const hasCompare   = !!(compareFrom && compareTo);

  const p = getPrisma(req as any) as any;

  // Fetch all sections in parallel
  const [revenue, cogs, opex, other, tax] = await Promise.all([
    fetchSectionAmounts(p, tenantId, from, to, '4000', '5000', 'CREDIT'),
    fetchSectionAmounts(p, tenantId, from, to, '5000', '6000', 'DEBIT'),
    fetchSectionAmounts(p, tenantId, from, to, '6000', '7000', 'DEBIT'),
    fetchSectionAmounts(p, tenantId, from, to, '7000', '8000', 'CREDIT'),
    fetchSectionAmounts(p, tenantId, from, to, '8000', '9000', 'DEBIT'),
  ]);

  // Compare period (optional)
  const [revComp, cogsComp, opexComp] = hasCompare ? await Promise.all([
    fetchSectionAmounts(p, tenantId, compareFrom!, compareTo!, '4000', '5000', 'CREDIT'),
    fetchSectionAmounts(p, tenantId, compareFrom!, compareTo!, '5000', '6000', 'DEBIT'),
    fetchSectionAmounts(p, tenantId, compareFrom!, compareTo!, '6000', '7000', 'DEBIT'),
  ]) : [[], [], []];

  const sum  = (arr: typeof revenue) => arr.reduce((s, a) => s + a.net, 0);
  const rnd  = (v: number) => Math.round(v * 100) / 100;
  const pct  = (curr: number, prev: number) => prev === 0 ? null : `${((curr - prev) / Math.abs(prev) * 100).toFixed(1)}%`;

  const compMap = (arr: typeof revenue): Map<number, number> =>
    new Map(arr.map(a => [a.accountId, a.net]));

  const buildLines = (arr: typeof revenue, compArr: typeof revenue): PLLine[] =>
    arr.map(a => {
      const cp = compArr.find(c => c.accountId === a.accountId)?.net ?? null;
      return {
        code:      a.code,
        name:      a.nameAr,
        amount:    rnd(a.net),
        compare:   cp !== null ? rnd(cp) : null,
        change:    cp !== null ? rnd(a.net - cp) : null,
        changePct: cp !== null ? pct(a.net, cp) : null,
      };
    }).sort((a, b) => a.code.localeCompare(b.code));

  const totalRevenue = sum(revenue); const totalRevenueComp = sum(revComp);
  const totalCOGS    = sum(cogs);    const totalCOGSComp    = sum(cogsComp);
  const totalOpex    = sum(opex);    const totalOpexComp    = sum(opexComp);
  const totalOther   = sum(other);
  const totalTax     = sum(tax);

  const grossProfit  = totalRevenue - totalCOGS;
  const ebit         = grossProfit  - totalOpex;
  const ebt          = ebit         + totalOther;
  const netIncome    = ebt          - totalTax;

  const grossMargin  = totalRevenue === 0 ? 0 : Math.round((grossProfit / totalRevenue) * 1000) / 10;
  const netMargin    = totalRevenue === 0 ? 0 : Math.round((netIncome   / totalRevenue) * 1000) / 10;

  const sections: PLSection[] = [
    { section: 'الإيرادات (Revenue)',               lines: buildLines(revenue, revComp),  total: rnd(totalRevenue), compare: hasCompare ? rnd(totalRevenueComp) : null },
    { section: 'تكلفة المبيعات (COGS)',              lines: buildLines(cogs,    cogsComp), total: rnd(totalCOGS),    compare: hasCompare ? rnd(totalCOGSComp)    : null },
    { section: 'المصروفات التشغيلية (Opex)',          lines: buildLines(opex,    opexComp), total: rnd(totalOpex),    compare: hasCompare ? rnd(totalOpexComp)    : null },
    { section: 'إيرادات/مصروفات أخرى (Other)',       lines: buildLines(other,   []),       total: rnd(totalOther),   compare: null },
    { section: 'الضريبة (Tax)',                       lines: buildLines(tax,     []),       total: rnd(totalTax),     compare: null },
  ];

  log.info('P&L generated', { tenantId, from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0], netIncome: rnd(netIncome) });

  if (format === 'csv') {
    const rows = sections.flatMap(s => [
      `"${s.section}",,,,`,
      ...s.lines.map(l => `"  ${l.code}","${l.name}",${l.amount},${l.compare ?? ''},${l.changePct ?? ''}`),
      `"TOTAL ${s.section}",,${s.total},,`,
      ',,,,',
    ]);
    const csv = `account,name,${to.toISOString().split('T')[0]},${hasCompare ? compareTo!.toISOString().split('T')[0] : 'compare'},change%\n` + rows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pl_${tenantId}_${to.toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    tenantId,
    period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    comparePeriod: hasCompare ? { from: compareFrom!.toISOString().split('T')[0], to: compareTo!.toISOString().split('T')[0] } : null,
    summary: {
      totalRevenue:  rnd(totalRevenue),
      totalCOGS:     rnd(totalCOGS),
      grossProfit:   rnd(grossProfit),
      grossMargin:   `${grossMargin}%`,
      totalOpex:     rnd(totalOpex),
      ebit:          rnd(ebit),
      totalOther:    rnd(totalOther),
      ebt:           rnd(ebt),
      totalTax:      rnd(totalTax),
      netIncome:     rnd(netIncome),
      netMargin:     `${netMargin}%`,
    },
    sections,
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
