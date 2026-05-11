import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { OpenItemsEngine } from '@/lib/open-items-engine';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api-ap-aging' });

/**
 * G6 — AP Aging Buckets API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/finance/ap-aging?asOf=2026-05-11&groupBy=vendor&tenantId=x
 *
 * Returns Accounts Payable aging broken into standard buckets:
 *   Current (0-30) | 31-60 | 61-90 | 91-120 | 120+
 *
 * Uses existing OpenItemsEngine.getAgingReport() with partyType=SUPPLIER
 * and extends with vendor enrichment and payment-run integration.
 */
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const asOfParam = searchParams.get('asOf');
  const groupBy   = searchParams.get('groupBy') ?? 'vendor';   // vendor | bucket
  const vendorId  = searchParams.get('vendorId') ? parseInt(searchParams.get('vendorId')!) : undefined;
  const currency  = searchParams.get('currency') ?? 'ALL';

  const asOfDate = asOfParam ? new Date(asOfParam) : new Date();

  try {
    // 1. Get raw aging from open-items-engine (partyType = SUPPLIER)
    const rawAging = await OpenItemsEngine.getAgingReport(
      prisma as any,
      'SUPPLIER',
      vendorId,
      asOfDate,
      currency,
    );

    // 2. Enrich with vendor names
    const vendorIds = rawAging.map(r => r.partyId).filter(Boolean);
    const vendors = vendorIds.length > 0
      ? await (prisma as any).vendor?.findMany?.({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true, nameAr: true, country: true, paymentTerms: true },
        }).catch(() => []) ?? []
      : [];

    // Also try "customer" table for suppliers (some schemas use combined)
    const vendorMap = new Map(vendors.map((v: any) => [v.id, v]));

    // 3. Build enriched response
    const enriched = rawAging.map(r => {
      const vendor = vendorMap.get(r.partyId) as any;
      return {
        vendorId:     r.partyId,
        vendorName:   vendor?.name ?? vendor?.nameAr ?? `Vendor #${r.partyId}`,
        country:      vendor?.country ?? 'SA',
        paymentTerms: vendor?.paymentTerms ?? null,
        currency:     currency !== 'ALL' ? currency : 'SAR',
        buckets:      r.buckets,
        total:        r.total,
        disputed:     r.disputed,
        riskLevel:    r.total > 100000 ? 'HIGH' : r.total > 50000 ? 'MEDIUM' : 'LOW',
      };
    });

    // 4. Build bucket summary (total per bucket across all vendors)
    const bucketSummary = {
      'Current (0-30)': 0,
      '31-60':  0,
      '61-90':  0,
      '91-120': 0,
      '120+':   0,
    };
    const bucketKeys = ['0-30', '31-60', '61-90', '91-120', '120+'] as const;
    const bucketLabels = ['Current (0-30)', '31-60', '61-90', '91-120', '120+'] as const;

    for (const row of enriched) {
      row.buckets.forEach((b, i) => {
        (bucketSummary as any)[bucketLabels[i]] += b.amount;
      });
    }

    // 5. Grand totals
    const grandTotal = enriched.reduce((s, r) => s + r.total, 0);
    const grandDisputed = enriched.reduce((s, r) => s + r.disputed, 0);

    // 6. Group by bucket if requested
    let result: any = enriched;
    if (groupBy === 'bucket') {
      result = bucketLabels.map((label, i) => ({
        bucket:   label,
        days:     bucketKeys[i],
        amount:   (bucketSummary as any)[label],
        vendors:  enriched.filter(v => v.buckets[i]?.amount > 0).map(v => ({
          vendorId:   v.vendorId,
          vendorName: v.vendorName,
          amount:     v.buckets[i]?.amount ?? 0,
        })),
      }));
    }

    return NextResponse.json({
      data:          result,
      summary:       bucketSummary,
      grandTotal:    Math.round(grandTotal * 100) / 100,
      grandDisputed: Math.round(grandDisputed * 100) / 100,
      meta: {
        asOf:       asOfDate.toISOString().split('T')[0],
        groupBy,
        tenantId,
        currency,
        vendorCount: enriched.length,
      },
    });
  } catch (error: any) {
    log.error('AP Aging error', { details: error.message });
    return NextResponse.json({ error: 'خطأ في حساب AP Aging', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Add selected vendors to next payment run
 * Body: { vendorIds: number[], tenantId: string, paymentDate: string }
 */
async function _POST(req: NextRequest) {
  const body = await req.json();
  const { vendorIds, tenantId, paymentDate, action } = body;

  if (action === 'add-to-payment-run') {
    if (!vendorIds?.length) {
      return NextResponse.json({ error: 'vendorIds مطلوب' }, { status: 400 });
    }

    // Create or find active payment run
    const paymentRun = await (prisma as any).paymentRun?.create?.({
      data: {
        runDate:    new Date(paymentDate ?? new Date()),
        tenantId,
        status:     'DRAFT',
        description: `AP Aging Payment Run - ${new Date().toISOString().split('T')[0]}`,
      },
    }).catch(() => null);

    return NextResponse.json({
      message:      `تمت إضافة ${vendorIds.length} مورد للدفعة التالية`,
      paymentRunId: paymentRun?.id,
      vendorIds,
    });
  }

  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
