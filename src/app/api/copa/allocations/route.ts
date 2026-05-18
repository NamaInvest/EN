import { NextRequest, NextResponse } from 'next/server';
import { COPAEngine } from '@/lib/copa-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const alloc = await COPAEngine.createAllocation(body.sourceCC, body.targetDim, body.allocationKey, body.percent);
    return NextResponse.json({ alloc }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
