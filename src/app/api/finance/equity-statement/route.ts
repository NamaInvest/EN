import { NextRequest, NextResponse } from 'next/server';
import { EquityStatementEngine } from '@/lib/equity-statement-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const layer    = searchParams.get('layer') ?? 'BOOK';
  const data = await EquityStatementEngine.generate(tenantId, period, layer);
  return NextResponse.json({ data });
}
