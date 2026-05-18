import { NextRequest, NextResponse } from 'next/server';
import { COPAEngine } from '@/lib/copa-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const results = await COPAEngine.runAllocation(body.sourceCC, body.period, body.totalCost);
    return NextResponse.json({ results });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
