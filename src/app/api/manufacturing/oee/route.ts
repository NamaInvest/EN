import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { OEEEngine } from '@/lib/oee-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const { machineId, shiftId, plannedTime, runTime, idealCycleTime, totalCount, rejectCount } = body;
    const record = await OEEEngine.record(tenant, machineId, shiftId, plannedTime, runTime, idealCycleTime, totalCount, rejectCount);
    return NextResponse.json({ record }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const from = new Date(searchParams.get('from') ?? new Date(Date.now() - 7 * 86400000));
    const to   = new Date(searchParams.get('to') ?? new Date());
    const data = await OEEEngine.getDashboard(tenant, from, to);
    return NextResponse.json({ data });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
