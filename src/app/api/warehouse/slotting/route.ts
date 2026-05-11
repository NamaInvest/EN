import { NextRequest, NextResponse } from 'next/server';
import { SlottingEngine } from '@/lib/slotting-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const recommendations = await SlottingEngine.generateRecommendations(tenantId);
  return NextResponse.json({ recommendations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'apply') {
    const result = await SlottingEngine.applyRecommendation(body.id);
    return NextResponse.json({ result });
  }
  if (body.type === 'create') {
    const rec = await SlottingEngine.createRecommendation(body.tenantId, body.itemId, body.suggestedBin, body.velocityClass, body.currentBin);
    return NextResponse.json({ rec }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
