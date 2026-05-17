import { NextRequest, NextResponse } from 'next/server';
import { ESSEngine } from '@/lib/ess-engine';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const tenantId = requireTenantId(req as any);
  const prisma = getPrisma(req);

  const { searchParams } = new URL(req.url);
  const employeeId = Number(searchParams.get('employeeId'));
  const view       = searchParams.get('view') ?? 'dashboard';
  
  if (view === 'dashboard') return NextResponse.json(await ESSEngine.getDashboard(prisma, employeeId, tenantId));
  if (view === 'payroll')   return NextResponse.json({ payroll: await ESSEngine.getPayrollInfo(prisma, employeeId, tenantId) });
  if (view === 'team') {
    const department = searchParams.get('department') ?? '';
    return NextResponse.json({ team: await ESSEngine.getTeamDirectory(prisma, department, tenantId) });
  }
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const tenantId = requireTenantId(req as any);
  const prisma = getPrisma(req);

  const body = await req.json();
  if (body.type === 'leave')  return NextResponse.json(await ESSEngine.requestLeave(prisma, body.employeeId, body.leaveType, new Date(body.startDate), new Date(body.endDate), body.reason, tenantId), { status: 201 });
  if (body.type === 'update') return NextResponse.json(await ESSEngine.updateContactInfo(prisma, body.employeeId, body, tenantId));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
