import { NextRequest, NextResponse } from 'next/server';
import { ESSEngine } from '@/lib/ess-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getPrisma } from '@/lib/prisma';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const user = auth;
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });


    const { searchParams } = new URL(req.url);
    const employeeId = Number(searchParams.get('employeeId'));
    const view       = searchParams.get('view') ?? 'dashboard';

    if (view === 'dashboard') return NextResponse.json(await ESSEngine.getDashboard(prisma, employeeId, tenant));
    if (view === 'payroll')   return NextResponse.json({ payroll: await ESSEngine.getPayrollInfo(prisma, employeeId, tenant) });
    if (view === 'team') {
    const department = searchParams.get('department') ?? '';
    return NextResponse.json({ team: await ESSEngine.getTeamDirectory(prisma, department, tenant) });
    }
    return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const user = auth;
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });


    const body = await req.json();
    if (body.type === 'leave')  return NextResponse.json(await ESSEngine.requestLeave(prisma, body.employeeId, body.leaveType, new Date(body.startDate), new Date(body.endDate), body.reason, tenant), { status: 201 });
    if (body.type === 'update') return NextResponse.json(await ESSEngine.updateContactInfo(prisma, body.employeeId, body, tenant));
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
