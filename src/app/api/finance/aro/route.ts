import { NextRequest, NextResponse } from 'next/server';
import { AROEngine } from '@/lib/aro-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const { assetId, settlementCost, settlementDate, discountRate } = body;
    const aro = await AROEngine.record(tenant, assetId, settlementCost, new Date(settlementDate), discountRate);
    return NextResponse.json({ aro }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const PUT = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const accretion = await AROEngine.accrue(body.aroId, new Date(body.period));
    return NextResponse.json({ accretion });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
