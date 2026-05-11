import { NextRequest, NextResponse } from 'next/server';
import { ESSEngine } from '@/lib/ess-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = Number(searchParams.get('employeeId'));
  const tenantId   = searchParams.get('tenantId') ?? 'default';
  const view       = searchParams.get('view') ?? 'dashboard';
  if (view === 'dashboard') return NextResponse.json(await ESSEngine.getDashboard(employeeId, tenantId));
  if (view === 'payroll')   return NextResponse.json({ payroll: await ESSEngine.getPayrollInfo(employeeId) });
  if (view === 'team') {
    const department = searchParams.get('department') ?? '';
    return NextResponse.json({ team: await ESSEngine.getTeamDirectory(department) });
  }
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'leave')  return NextResponse.json(await ESSEngine.requestLeave(body.employeeId, body.leaveType, new Date(body.startDate), new Date(body.endDate), body.reason), { status: 201 });
  if (body.type === 'update') return NextResponse.json(await ESSEngine.updateContactInfo(body.employeeId, body));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
