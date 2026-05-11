import { NextRequest, NextResponse } from 'next/server';
import { CustomerHealthEngine } from '@/lib/customer-health-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await CustomerHealthEngine.upsertHealth(body.tenantId, body.customerId, body.factors);
  return NextResponse.json({ result }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? '1';
  const threshold = Number(searchParams.get('threshold') ?? 40);
  const atRisk = await CustomerHealthEngine.getAtRisk(tenantId, threshold);
  return NextResponse.json({ atRisk, count: atRisk.length });
}
