import { NextRequest, NextResponse } from 'next/server';
import { OKREngine } from '@/lib/okr-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
    const data = await OKREngine.getProgress(tenant, period);
    return NextResponse.json({ data });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'objective') {
    const obj = await OKREngine.createObjective(tenant, body.ownerEmpId, body.title, body.period, body.level, body.parentObjectiveId);
    return NextResponse.json({ obj }, { status: 201 });
    }
    if (body.type === 'key_result') {
    const kr = await OKREngine.addKeyResult(tenant, body.objectiveId, body.title, body.targetValue);
    return NextResponse.json({ kr }, { status: 201 });
    }
    if (body.type === 'update') {
    const kr = await OKREngine.updateProgress(tenant, body.keyResultId, body.currentValue, body.confidence);
    return NextResponse.json({ kr });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
