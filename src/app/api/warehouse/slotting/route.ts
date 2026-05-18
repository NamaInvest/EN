import { NextRequest, NextResponse } from 'next/server';
import { SlottingEngine } from '@/lib/slotting-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const recommendations = await SlottingEngine.generateRecommendations(tenant);
    return NextResponse.json({ recommendations });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'apply') {
    const result = await SlottingEngine.applyRecommendation(body.id);
    return NextResponse.json({ result });
    }
    if (body.type === 'create') {
    const rec = await SlottingEngine.createRecommendation(tenant, body.itemId, body.suggestedBin, body.velocityClass, body.currentBin);
    return NextResponse.json({ rec }, { status: 201 });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
