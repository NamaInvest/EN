/**
 * AP/AR Aging Report API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/accounting/aging?type=AR&tenantId=X&asOf=YYYY-MM-DD
 * GET /api/accounting/aging?type=AP&tenantId=X
 *
 * يُولِّد تقرير التقادم الزمني للذمم:
 *   AR (مدينة): العملاء المتأخرون في السداد
 *   AP (دائنة): المستحقات للموردين
 *
 * الفترات القياسية (SOCPA):
 *   Current    — لم يحل موعد استحقاقه
 *   1-30 days  — متأخر 1-30 يوم
 *   31-60 days — متأخر 31-60 يوم
 *   61-90 days — متأخر 61-90 يوم
 *   91-120 days
 *   > 120 days — بالغ التأخير (خطر شطب)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.aging' });

// ─── Aging Buckets ────────────────────────────────────────────────────────────
const BUCKETS = [
  { label: 'غير مستحق',      minDays: null, maxDays: 0    },
  { label: '1–30 يوم',       minDays: 1,    maxDays: 30   },
  { label: '31–60 يوم',      minDays: 31,   maxDays: 60   },
  { label: '61–90 يوم',      minDays: 61,   maxDays: 90   },
  { label: '91–120 يوم',     minDays: 91,   maxDays: 120  },
  { label: '> 120 يوم',      minDays: 121,  maxDays: null },
] as const;

interface AgingLine {
  entityId:   number;
  entityName: string;
  entityCode: string;
  vatNumber?: string;
  current:    number;
  days1_30:   number;
  days31_60:  number;
  days61_90:  number;
  days91_120: number;
  over120:    number;
  total:      number;
  oldestDue:  string | null;
}

function getBucket(daysPastDue: number): keyof Omit<AgingLine, 'entityId'|'entityName'|'entityCode'|'vatNumber'|'total'|'oldestDue'> {
  if (daysPastDue <= 0)   return 'current';
  if (daysPastDue <= 30)  return 'days1_30';
  if (daysPastDue <= 60)  return 'days31_60';
  if (daysPastDue <= 90)  return 'days61_90';
  if (daysPastDue <= 120) return 'days91_120';
  return 'over120';
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type     = (searchParams.get('type') ?? 'AR').toUpperCase() as 'AR' | 'AP';
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const asOfStr  = searchParams.get('asOf');
  const asOf     = asOfStr ? new Date(asOfStr) : new Date();
  const topN     = parseInt(searchParams.get('top') ?? '0');  // 0 = all

  const prismaClient = getPrisma(req as any);
  const p            = prismaClient as any;

  // ── Fetch open invoices ────────────────────────────────────────────────────
  const model   = type === 'AR' ? 'salesInvoice' : 'purchaseInvoice';
  const fkField = type === 'AR' ? 'customerId'   : 'supplierId';
  const include = type === 'AR'
    ? { customer: { select: { id: true, name: true, code: true, vatNumber: true } } }
    : { supplier: { select: { id: true, name: true, code: true, vatNumber: true } } };

  const invoices = await p[model]?.findMany?.({
    where: {
      tenantId,
      status:     { in: ['POSTED', 'PARTIAL'] },
      openAmount: { gt: 0 },
      date:       { lte: asOf },
    },
    include,
    orderBy: { dueDate: 'asc' },
  }).catch(() => []) ?? [];

  // ── Aggregate by entity ────────────────────────────────────────────────────
  const entityMap = new Map<number, AgingLine>();

  for (const inv of invoices) {
    const entity   = type === 'AR' ? inv.customer : inv.supplier;
    if (!entity) continue;

    const entityId = entity.id;
    const dueDate  = inv.dueDate ? new Date(inv.dueDate) : asOf;
    const msDiff   = asOf.getTime() - dueDate.getTime();
    const daysPast = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    const bucket   = getBucket(daysPast);
    const amount   = Number(inv.openAmount ?? inv.remainingAmount ?? 0);

    if (!entityMap.has(entityId)) {
      entityMap.set(entityId, {
        entityId,
        entityName: entity.name ?? entity.nameEn ?? '',
        entityCode: entity.code ?? String(entityId),
        vatNumber:  entity.vatNumber,
        current: 0, days1_30: 0, days31_60: 0,
        days61_90: 0, days91_120: 0, over120: 0,
        total: 0,
        oldestDue: null,
      });
    }

    const line = entityMap.get(entityId)!;
    line[bucket] += amount;
    line.total   += amount;

    if (!line.oldestDue || dueDate < new Date(line.oldestDue)) {
      line.oldestDue = dueDate.toISOString().split('T')[0];
    }
  }

  // ── Sort by total descending ───────────────────────────────────────────────
  let lines = Array.from(entityMap.values())
    .sort((a, b) => b.total - a.total)
    .map(l => ({
      ...l,
      current:    Math.round(l.current    * 100) / 100,
      days1_30:   Math.round(l.days1_30   * 100) / 100,
      days31_60:  Math.round(l.days31_60  * 100) / 100,
      days61_90:  Math.round(l.days61_90  * 100) / 100,
      days91_120: Math.round(l.days91_120 * 100) / 100,
      over120:    Math.round(l.over120    * 100) / 100,
      total:      Math.round(l.total      * 100) / 100,
    }));

  if (topN > 0) lines = lines.slice(0, topN);

  // ── Totals row ─────────────────────────────────────────────────────────────
  const totals = lines.reduce(
    (s, l) => ({
      current:    s.current    + l.current,
      days1_30:   s.days1_30   + l.days1_30,
      days31_60:  s.days31_60  + l.days31_60,
      days61_90:  s.days61_90  + l.days61_90,
      days91_120: s.days91_120 + l.days91_120,
      over120:    s.over120    + l.over120,
      total:      s.total      + l.total,
    }),
    { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, over120: 0, total: 0 },
  );

  // ── Risk analysis ──────────────────────────────────────────────────────────
  const highRisk = lines
    .filter(l => l.over120 > 0)
    .map(l => ({ entityName: l.entityName, over120: l.over120 }))
    .slice(0, 10);

  const collectionEfficiency = totals.total > 0
    ? Math.round((totals.current / totals.total) * 100)
    : 100;

  log.info('Aging report generated', {
    tenantId, type, asOf: asOf.toISOString().split('T')[0],
    entities: lines.length, total: Math.round(totals.total),
  });

  return NextResponse.json({
    type,
    tenantId,
    asOf:    asOf.toISOString().split('T')[0],
    lines,
    totals:  Object.fromEntries(
      Object.entries(totals).map(([k, v]) => [k, Math.round((v as number) * 100) / 100])
    ),
    summary: {
      totalEntities:         lines.length,
      totalOutstanding:      Math.round(totals.total      * 100) / 100,
      currentAmount:         Math.round(totals.current    * 100) / 100,
      overdueAmount:         Math.round((totals.total - totals.current) * 100) / 100,
      criticalAmount:        Math.round(totals.over120    * 100) / 100,
      collectionEfficiency:  `${collectionEfficiency}%`,
      highRiskEntities:      highRisk,
    },
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
