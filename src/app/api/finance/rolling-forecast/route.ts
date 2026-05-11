import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RollingBudgetEngine, type Scenario } from '@/lib/rolling-budget-engine';
import { z } from 'zod';

const RecalcSchema = z.object({
  tenantId: z.string(),
  scenario: z.enum(['BASE', 'BEST', 'WORST']).default('BASE'),
});

const DriverSchema = z.object({
  tenantId: z.string(),
  scenario: z.enum(['BASE', 'BEST', 'WORST']).default('BASE'),
  driver:   z.string(),
  month:    z.string().regex(/^\d{4}-\d{2}$/),
  value:    z.number(),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const action   = searchParams.get('action') ?? 'horizon';
  const scenario = (searchParams.get('scenario') ?? 'BASE') as Scenario;
  const period   = searchParams.get('period') ?? '';

  if (action === 'horizon') {
    return NextResponse.json({ horizon: RollingBudgetEngine.getHorizon() });
  }

  if (action === 'variance') {
    if (!period) return NextResponse.json({ error: 'period مطلوب (e.g. 2026-Q1 or 2026-01)' }, { status: 400 });
    const variance = await RollingBudgetEngine.getVariance(tenantId, period);
    return NextResponse.json({ data: variance, period, redCount: variance.filter(v => v.status === 'RED').length });
  }

  if (action === 'forecast') {
    const lines = await RollingBudgetEngine.recalculate(tenantId, scenario);
    return NextResponse.json({ data: lines, scenario, horizon: RollingBudgetEngine.getHorizon() });
  }

  return NextResponse.json({ error: 'action يجب أن يكون: horizon | variance | forecast' }, { status: 400 });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action;

  if (action === 'recalc') {
    const parsed = RecalcSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    const lines = await RollingBudgetEngine.recalculate(parsed.data.tenantId, parsed.data.scenario);
    return NextResponse.json({ lines: lines.length, scenario: parsed.data.scenario, horizon: RollingBudgetEngine.getHorizon() });
  }

  if (action === 'upsert-driver') {
    const parsed = DriverSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    await RollingBudgetEngine.upsertDriver(parsed.data);
    return NextResponse.json({ success: true, ...parsed.data });
  }

  if (action === 'roll-forward') {
    const { tenantId } = body;
    if (!tenantId) return NextResponse.json({ error: 'tenantId مطلوب' }, { status: 400 });
    const result = await RollingBudgetEngine.rollForward(tenantId);
    return NextResponse.json({ success: true, ...result });
  }

  return NextResponse.json({ error: 'action يجب أن يكون: recalc | upsert-driver | roll-forward' }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
