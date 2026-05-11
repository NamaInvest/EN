import { NextRequest, NextResponse } from 'next/server';
import { SpendAnalyticsEngine } from '@/lib/spend-analytics-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'classify') {
    const result = await SpendAnalyticsEngine.classify(body.tenantId, body.transactionType, body.transactionId, body.description, body.categoryId);
    return NextResponse.json({ result }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const cube = await SpendAnalyticsEngine.buildCube(tenantId);
  return NextResponse.json({ cube });
}
