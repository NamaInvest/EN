import { NextRequest, NextResponse } from 'next/server';
import { CalibrationEngine } from '@/lib/calibration-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const daysAhead = Number(searchParams.get('daysAhead') ?? 30);
  const due = await CalibrationEngine.getDueEquipment(tenantId, daysAhead);
  const overdue = await CalibrationEngine.getOverdue(tenantId);
  return NextResponse.json({ due, overdue });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await CalibrationEngine.recordCalibration(body.equipmentId, body.performedBy, body.result, body.certificateUrl);
  return NextResponse.json({ result }, { status: 201 });
}
