/**
 * Deferred Tax API  (IAS 12)
 * ══════════════════════════════════════════════════════════════════════════════
 * GET  /api/accounting/deferred-tax?tenantId=X&asOf=YYYY-MM-DD&taxRate=0.20
 * GET  /api/accounting/deferred-tax?view=rollforward&tenantId=X&year=2024
 * POST /api/accounting/deferred-tax  { action: 'recognize', tenantId, deferredTaxIds[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { DeferredTaxEngine } from '@/lib/deferred-tax-engine';

const RecognizeSchema = z.object({
  tenantId:       z.string(),
  deferredTaxIds: z.array(z.number().int().positive()).min(1),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const view      = searchParams.get('view') ?? 'current';
  const asOfParam = searchParams.get('asOf');
  const taxRate   = parseFloat(searchParams.get('taxRate') ?? '0.20');
  const year      = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

  if (view === 'rollforward') {
    const rollforward = await DeferredTaxEngine.generateRollforward(tenantId, year);
    return NextResponse.json({ tenantId, year, rollforward, generatedAt: new Date().toISOString() });
  }

  // Current temporary differences
  const asOf   = asOfParam ? new Date(asOfParam) : new Date();
  const diffs  = await DeferredTaxEngine.calculateForPeriod(tenantId, asOf, taxRate);

  const totalDTA = diffs
    .filter((d: any) => d.type === 'DEDUCTIBLE')
    .reduce((s: number, d: any) => s + Number(d.deferredTaxAmount ?? d.taxEffect ?? 0), 0);
  const totalDTL = diffs
    .filter((d: any) => d.type === 'TAXABLE')
    .reduce((s: number, d: any) => s + Number(d.deferredTaxAmount ?? d.taxEffect ?? 0), 0);

  return NextResponse.json({
    tenantId,
    asOf:    asOf.toISOString().split('T')[0],
    taxRate: `${(taxRate * 100).toFixed(0)}%`,
    temporaryDifferences: diffs,
    summary: {
      deferredTaxAssets:      Math.round(totalDTA * 100) / 100,
      deferredTaxLiabilities: Math.round(totalDTL * 100) / 100,
      netDeferredTaxPosition: Math.round((totalDTA - totalDTL) * 100) / 100,
    },
    generatedAt: new Date().toISOString(),
  });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as string;

  if (action === 'recognize') {
    const p = RecognizeSchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await DeferredTaxEngine.recognizeJournalEntry(
      p.data.tenantId,
      p.data.deferredTaxIds,
    );
    return NextResponse.json(result, { status: 201 });
  }

  return NextResponse.json({
    error:   'action غير صحيح',
    options: ['recognize'],
  }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
