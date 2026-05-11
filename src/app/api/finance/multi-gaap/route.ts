import { NextRequest, NextResponse } from 'next/server';
import { MultiGAAPEngine } from '@/lib/multi-gaap-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await MultiGAAPEngine.recordAdjustment(body);
  return NextResponse.json({ entry }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId     = searchParams.get('tenantId') ?? '1';
  const baseBookId   = Number(searchParams.get('baseBookId') ?? 1);
  const compareBookId = Number(searchParams.get('compareBookId') ?? 2);
  const reconciliation = await MultiGAAPEngine.reconcileBooks(tenantId, baseBookId, compareBookId);
  return NextResponse.json({ reconciliation });
}
