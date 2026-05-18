import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { APSEngine } from '@/lib/aps-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'run') {
    const run = await APSEngine.runSchedule(tenant, body.horizonDays ?? 30);
    return NextResponse.json({ run }, { status: 201 });
    }
    if (body.type === 'schedule_op') {
    const op = await APSEngine.scheduleOperation(body.manufacturingOrderId, body.operationId, body.workCenterId, new Date(body.plannedStart), new Date(body.plannedEnd), tenant, body.sequence);
    return NextResponse.json({ op }, { status: 201 });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const workCenterId = Number(searchParams.get('workCenterId') ?? 0);
    const conflicts = await APSEngine.detectConflicts(tenant, workCenterId);
    return NextResponse.json({ conflicts });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
