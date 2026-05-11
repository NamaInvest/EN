import { NextRequest, NextResponse } from 'next/server';
import { BOMEngine } from '@/lib/bom-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view      = searchParams.get('view') ?? 'where-used';
  const productId = Number(searchParams.get('productId') ?? 0);
  const bomId     = Number(searchParams.get('bomId') ?? 0);
  const tenantId  = searchParams.get('tenantId') ?? '1';

  if (view === 'where-used') return NextResponse.json({ result: await BOMEngine.whereUsed(productId, tenantId) });
  if (view === 'explode')    return NextResponse.json({ result: await BOMEngine.explode(bomId) });
  if (view === 'cost')       return NextResponse.json({ result: await BOMEngine.calculateCost(bomId) });
  return NextResponse.json({ error: 'view must be where-used | explode | cost' }, { status: 400 });
}
