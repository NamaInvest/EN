import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { SPCEngine } from '@/lib/spc-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const result = await SPCEngine.addMeasurement(body.chartId, body.subgroupNumber, body.measurements);
    return NextResponse.json({ result }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const chartId = Number(searchParams.get('chartId') ?? 0);
    const violations = await SPCEngine.getViolations(chartId);
    return NextResponse.json({ violations });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
