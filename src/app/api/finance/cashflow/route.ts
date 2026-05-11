import { NextRequest, NextResponse } from 'next/server';
import { CashflowDirectEngine } from '@/lib/cashflow-direct-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  await CashflowDirectEngine.buildStatement(tenantId, period);
  const data = await CashflowDirectEngine.buildStatement(tenantId, period);
  return NextResponse.json({ data });
}
