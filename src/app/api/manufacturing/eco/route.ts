import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { ECOEngine } from '@/lib/eco-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'create') {
    const eco = await ECOEngine.create(tenant, body);
    return NextResponse.json({ eco }, { status: 201 });
    }
    if (body.type === 'approve') {
    const eco = await ECOEngine.approve(body.id, body.approvedBy);
    return NextResponse.json({ eco });
    }
    if (body.type === 'implement') {
    const eco = await ECOEngine.implement(body.id);
    return NextResponse.json({ eco });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
