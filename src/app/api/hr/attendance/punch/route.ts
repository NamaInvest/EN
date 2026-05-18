import { NextRequest, NextResponse } from 'next/server';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { TNAEngine } from '@/lib/tna-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    tenant = tenant;
    // Validate geofence if coords provided
    if (body.geoLatitude && body.geoLongitude) {
    const HQ_LAT = 24.7136, HQ_LNG = 46.6753;
    const valid = TNAEngine.validateGeofence(body.geoLatitude, body.geoLongitude, HQ_LAT, HQ_LNG);
    if (!valid) return NextResponse.json({ error: 'Punch outside approved geofence' }, { status: 422 });
    }
    const punch = await TNAEngine.recordPunch(body);
    return NextResponse.json({ punch }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const employeeId = Number(searchParams.get('employeeId') ?? 0);
    const date = new Date(searchParams.get('date') ?? new Date());
    const punches = await TNAEngine.getDailySummary(tenant, employeeId, date);
    return NextResponse.json({ punches });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
