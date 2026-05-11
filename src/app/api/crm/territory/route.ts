import { NextRequest, NextResponse } from 'next/server';
import { TerritoryEngine } from '@/lib/territory-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'territory') {
    const territory = await TerritoryEngine.createTerritory(body.tenantId, body.code, body.name, body.managerId, body.regions);
    return NextResponse.json({ territory }, { status: 201 });
  }
  if (body.type === 'quota') {
    const quota = await TerritoryEngine.setQuota(body.tenantId, body.userId, body.period, body.quotaAmount);
    return NextResponse.json({ quota }, { status: 201 });
  }
  if (body.type === 'actual') {
    await TerritoryEngine.updateActual(body.tenantId, body.userId, body.period, body.actualAmount);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const attainment = await TerritoryEngine.getAttainment(tenantId, period);
  return NextResponse.json({ attainment });
}
