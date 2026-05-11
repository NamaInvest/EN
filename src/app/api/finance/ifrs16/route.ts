import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { IFRS16LeaseEngine } from '@/lib/ifrs16-lease-engine';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { postPurchaseInvoice } from '@/lib/auto-journal';

const log = logger.child({ service: 'api-ifrs16' });

// ─── Schemas ──────────────────────────────────────────────────────────────────

const LeaseCreateSchema = z.object({
  tenantId:                z.string(),
  userId:                  z.string().optional(),
  description:             z.string(),
  commencementDate:        z.string(),
  leaseTerm:               z.number().int().positive(),
  monthlyPayment:          z.number().positive(),
  incrementalBorrowingRate: z.number().positive().max(1),
  currency:                z.string().default('SAR'),
  isShortTerm:             z.boolean().default(false),
  isLowValue:              z.boolean().default(false),
  initialDirectCosts:      z.number().default(0),
  incentivesReceived:      z.number().default(0),
  postJournal:             z.boolean().default(true),
});

const LeaseModifySchema = z.object({
  tenantId:                 z.string(),
  leaseId:                  z.number().int().positive(),
  newMonthlyPayment:        z.number().positive(),
  newRemainingTerm:         z.number().int().positive(),
  newIncrementalBorrowingRate: z.number().positive().max(1),
  modificationDate:         z.string(),
  userId:                   z.string().optional(),
});

// ─── POST /api/finance/ifrs16 ─────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action ?? 'create';

  // ── Create / Recognize a new lease ──────────────────────────────────────
  if (action === 'create') {
    const parsed = LeaseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const d = parsed.data;
    const lease = IFRS16LeaseEngine.recognize({
      description:              d.description,
      commencementDate:         new Date(d.commencementDate),
      leaseTerm:                d.leaseTerm,
      monthlyPayment:           d.monthlyPayment,
      incrementalBorrowingRate: d.incrementalBorrowingRate,
      currency:                 d.currency,
      isShortTerm:              d.isShortTerm,
      isLowValue:               d.isLowValue,
      initialDirectCosts:       d.initialDirectCosts,
      incentivesReceived:       d.incentivesReceived,
    });

    // Save to database
    const saved = await (prisma as any).ifrsLeaseContract?.create?.({
      data: {
        tenantId:                d.tenantId,
        description:             d.description,
        commencementDate:        new Date(d.commencementDate),
        leaseTerm:               d.leaseTerm,
        monthlyPayment:          d.monthlyPayment,
        incrementalBorrowingRate: d.incrementalBorrowingRate,
        currency:                d.currency,
        rouAssetValue:           lease.rouAssetValue,
        leaseLiability:          lease.initialLeaseLiability,
        schedule:                JSON.stringify(lease.schedule),
        status:                  lease.isExempt ? 'EXEMPT' : 'ACTIVE',
        exemptReason:            lease.exemptReason,
      },
    }).catch(() => null);

    // Post opening journal entry if not exempt
    if (!lease.isExempt && d.postJournal && saved?.id) {
      try {
        await (prisma as any).journalEntry?.create?.({
          data: {
            tenantId:    d.tenantId,
            date:        new Date(d.commencementDate),
            description: `IFRS 16 — قيد افتتاحي: ${d.description}`,
            reference:   `LEASE-INIT-${saved.id}`,
            status:      'POSTED',
            createdBy:   d.userId ?? 'system',
            lines: {
              create: [
                // Dr ROU Asset
                {
                  accountCode: '1450',
                  description: `حق استخدام — ${d.description}`,
                  debit:       lease.rouAssetValue,
                  credit:      0,
                  tenantId:    d.tenantId,
                },
                // Cr Lease Liability
                {
                  accountCode: '2610',
                  description: `التزام إيجار — ${d.description}`,
                  debit:       0,
                  credit:      lease.initialLeaseLiability,
                  tenantId:    d.tenantId,
                },
                // Cr Cash for initial direct costs (if any)
                ...(d.initialDirectCosts > 0 ? [{
                  accountCode: '1110',
                  description: `تكاليف مباشرة أولية — ${d.description}`,
                  debit:       0,
                  credit:      d.initialDirectCosts,
                  tenantId:    d.tenantId,
                }] : []),
              ],
            },
          },
        }).catch(() => null);
      } catch (e: any) {
        log.warn('IFRS16: could not post opening journal', { error: e.message });
      }
    }

    return NextResponse.json({
      leaseId:                saved?.id,
      rouAssetValue:          lease.rouAssetValue,
      initialLeaseLiability:  lease.initialLeaseLiability,
      totalPayments:          lease.totalPayments,
      totalInterestExpense:   lease.totalInterestExpense,
      isExempt:               lease.isExempt,
      exemptReason:           lease.exemptReason,
      scheduleCount:          lease.schedule.length,
      firstMonth:             lease.schedule[0] ?? null,
      lastMonth:              lease.schedule[lease.schedule.length - 1] ?? null,
    });
  }

  // ── Modify (remeasure) existing lease ───────────────────────────────────
  if (action === 'modify') {
    const parsed = LeaseModifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const d = parsed.data;
    const modDate = new Date(d.modificationDate);

    // Re-recognize with new terms
    const revised = IFRS16LeaseEngine.recognize({
      leaseId:                  d.leaseId,
      description:              `Modification of Lease #${d.leaseId}`,
      commencementDate:         modDate,
      leaseTerm:                d.newRemainingTerm,
      monthlyPayment:           d.newMonthlyPayment,
      incrementalBorrowingRate: d.newIncrementalBorrowingRate,
    });

    // Update DB record
    await (prisma as any).ifrsLeaseContract?.update?.({
      where: { id: d.leaseId },
      data: {
        monthlyPayment:           d.newMonthlyPayment,
        incrementalBorrowingRate: d.newIncrementalBorrowingRate,
        leaseLiability:           revised.initialLeaseLiability,
        rouAssetValue:            revised.rouAssetValue,
        schedule:                 JSON.stringify(revised.schedule),
        updatedAt:                new Date(),
      },
    }).catch(() => null);

    return NextResponse.json({
      leaseId:               d.leaseId,
      newRouAsset:           revised.rouAssetValue,
      newLeaseLiability:     revised.initialLeaseLiability,
      newScheduleCount:      revised.schedule.length,
      modificationDate:      d.modificationDate,
    });
  }

  return NextResponse.json({ error: 'action يجب أن يكون: create | modify' }, { status: 400 });
}

// ─── GET /api/finance/ifrs16 ──────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const leaseId   = searchParams.get('leaseId');
  const action    = searchParams.get('action') ?? 'list';
  const period    = searchParams.get('period');  // "1" for month 1

  if (action === 'schedule' && leaseId) {
    const contract = await (prisma as any).ifrsLeaseContract?.findUnique?.({
      where: { id: parseInt(leaseId) },
    }).catch(() => null);

    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    const lease = IFRS16LeaseEngine.recognize({
      leaseId:                  contract.id,
      description:              contract.description,
      commencementDate:         contract.commencementDate,
      leaseTerm:                contract.leaseTerm,
      monthlyPayment:           Number(contract.monthlyPayment),
      incrementalBorrowingRate: Number(contract.incrementalBorrowingRate),
      currency:                 contract.currency,
    });

    const p = period ? parseInt(period) : null;
    if (p) {
      const monthlyEntries = IFRS16LeaseEngine.getMonthlyEntries(lease, p);
      return NextResponse.json({ leaseId, period: p, ...monthlyEntries });
    }

    return NextResponse.json({ leaseId, schedule: lease.schedule, summary: {
      rouAssetValue: lease.rouAssetValue,
      totalInterestExpense: lease.totalInterestExpense,
      totalPrincipal: lease.totalPrincipal,
    }});
  }

  if (action === 'maturity') {
    // IFRS 16.58 — Maturity analysis of lease liabilities
    const contracts = await (prisma as any).ifrsLeaseContract?.findMany?.({
      where: { tenantId, status: 'ACTIVE' },
    }).catch(() => []) ?? [];

    const now   = new Date();
    const bands = { within1Year: 0, from1to5Years: 0, over5Years: 0 };

    for (const c of contracts) {
      const remaining = Number(c.leaseLiability ?? 0);
      const months    = c.leaseTerm ?? 12;
      if (months <= 12)  bands.within1Year   += remaining;
      else if (months <= 60) bands.from1to5Years += remaining;
      else bands.over5Years += remaining;
    }

    return NextResponse.json({ tenantId, maturityAnalysis: bands, contracts: contracts.length });
  }

  // Default: list all leases
  const contracts = await (prisma as any).ifrsLeaseContract?.findMany?.({
    where: { tenantId },
    orderBy: { commencementDate: 'desc' },
    take: 50,
  }).catch(() => []) ?? [];

  return NextResponse.json({ data: contracts, count: contracts.length });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
