import { NextRequest, NextResponse } from 'next/server';
import { SalesForecastEngine } from '@/lib/sales-forecast-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'commit') {
    const commit = await SalesForecastEngine.submitForecast(body.tenantId, body.userId, body.period, body.commitAmount, body.bestCaseAmount);
    return NextResponse.json({ commit }, { status: 201 });
  }
  if (body.type === 'actual') {
    await SalesForecastEngine.updateActual(body.tenantId, body.userId, body.period, body.actualAmount);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const rollup = await SalesForecastEngine.rollup(tenantId, period);
  return NextResponse.json({ rollup });
}
