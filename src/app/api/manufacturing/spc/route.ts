import { NextRequest, NextResponse } from 'next/server';
import { SPCEngine } from '@/lib/spc-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await SPCEngine.addMeasurement(body.chartId, body.subgroupNumber, body.measurements);
  return NextResponse.json({ result }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chartId = Number(searchParams.get('chartId') ?? 0);
  const violations = await SPCEngine.getViolations(chartId);
  return NextResponse.json({ violations });
}
