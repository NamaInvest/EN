import { NextRequest, NextResponse } from 'next/server';
import { TNAEngine } from '@/lib/tna-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Validate geofence if coords provided
  if (body.geoLatitude && body.geoLongitude) {
    const HQ_LAT = 24.7136, HQ_LNG = 46.6753;
    const valid = TNAEngine.validateGeofence(body.geoLatitude, body.geoLongitude, HQ_LAT, HQ_LNG);
    if (!valid) return NextResponse.json({ error: 'Punch outside approved geofence' }, { status: 422 });
  }
  const punch = await TNAEngine.recordPunch(body);
  return NextResponse.json({ punch }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const employeeId = Number(searchParams.get('employeeId') ?? 0);
  const date = new Date(searchParams.get('date') ?? new Date());
  const punches = await TNAEngine.getDailySummary(tenantId, employeeId, date);
  return NextResponse.json({ punches });
}
