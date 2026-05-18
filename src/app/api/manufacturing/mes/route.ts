import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { MESEngine } from '@/lib/mes-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const stations = await MESEngine.getDashboard(tenant);
    return NextResponse.json({ stations });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const event = await MESEngine.recordEvent(body.stationId, body.eventType, body.quantity, body.rejectReason);
    return NextResponse.json({ event }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
