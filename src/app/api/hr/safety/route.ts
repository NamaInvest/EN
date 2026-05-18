import { NextRequest, NextResponse } from 'next/server';
import { EHSEngine } from '@/lib/ehs-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const incident = await EHSEngine.reportIncident(tenant, body);
    return NextResponse.json({ incident }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const from = new Date(searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000));
    const to   = new Date(searchParams.get('to') ?? new Date());
    const kpis = await EHSEngine.getKPIs(tenant, from, to);
    return NextResponse.json({ kpis });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
