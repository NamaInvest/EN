/**
 * Fixed Assets & Depreciation API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET  /api/accounting/depreciation?view=nbv&tenantId=X
 * GET  /api/accounting/depreciation?view=schedule&assetId=123&tenantId=X
 * POST /api/accounting/depreciation  { action: 'run-monthly', period, tenantId, fiscalYearId, dryRun? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { DepreciationEngine } from '@/lib/depreciation-engine';

const RunMonthlySchema = z.object({
  tenantId:     z.string(),
  period:       z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM'),
  fiscalYearId: z.number().int().positive(),
  userId:       z.string().or(z.number()).transform(String),
  dryRun:       z.boolean().optional().default(false),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view     = searchParams.get('view') ?? 'nbv';
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const assetId  = searchParams.get('assetId');
  const asOfStr  = searchParams.get('asOf');

  if (view === 'schedule') {
    if (!assetId) {
      return NextResponse.json({ error: 'assetId required for schedule view' }, { status: 400 });
    }
    const schedule = await DepreciationEngine.getAssetSchedule(parseInt(assetId), tenantId);
    if (!schedule) {
      return NextResponse.json({ error: `Asset ${assetId} not found` }, { status: 404 });
    }
    return NextResponse.json(schedule);
  }

  // Default: NBV report
  const asOf  = asOfStr ? new Date(asOfStr) : undefined;
  const report = await DepreciationEngine.getNBVReport(tenantId, asOf);
  return NextResponse.json(report);
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as string;

  if (action === 'run-monthly') {
    const p = RunMonthlySchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await DepreciationEngine.runMonthly(
      p.data.tenantId,
      p.data.period,
      p.data.userId,
      p.data.fiscalYearId,
      p.data.dryRun,
    );
    return NextResponse.json(result, { status: result.posted || result.totalCharge === 0 ? 200 : 422 });
  }

  return NextResponse.json({
    error:   'action غير صحيح',
    options: ['run-monthly'],
  }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'FINANCIAL' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
