import { NextRequest, NextResponse } from 'next/server';
import { ATSEngine } from '@/lib/ats-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'candidate') {
    const candidate = await ATSEngine.createCandidate(tenant, body);
    return NextResponse.json({ candidate }, { status: 201 });
    }
    if (body.type === 'apply') {
    const app = await ATSEngine.applyToRequisition(tenant, body.candidateId, body.requisitionId);
    return NextResponse.json({ app }, { status: 201 });
    }
    if (body.type === 'advance') {
    const app = await ATSEngine.advanceStage(tenant, body.applicationId, body.stage);
    return NextResponse.json({ app });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const requisitionId = Number(searchParams.get('requisitionId') ?? 0);
    const pipeline = await ATSEngine.getPipeline(tenant, requisitionId);
    return NextResponse.json({ pipeline });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
