import { NextRequest, NextResponse } from 'next/server';
import { CrossDockEngine } from '@/lib/cross-dock-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'assign') {
    const assignment = await CrossDockEngine.createAssignment(tenant, body.grnId, body.soId, body.itemId, body.quantity);
    return NextResponse.json({ assignment }, { status: 201 });
    }
    if (body.type === 'complete') {
    const result = await CrossDockEngine.complete(body.id);
    return NextResponse.json({ result });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
