import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { BOMEngine } from '@/lib/bom-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const view      = searchParams.get('view') ?? 'where-used';
    const productId = Number(searchParams.get('productId') ?? 0);
    const bomId     = Number(searchParams.get('bomId') ?? 0);


    if (view === 'where-used') return NextResponse.json({ result: await BOMEngine.whereUsed(productId, tenant) });
    if (view === 'explode')    return NextResponse.json({ result: await BOMEngine.explode(bomId) });
    if (view === 'cost')       return NextResponse.json({ result: await BOMEngine.calculateCost(bomId) });
    return NextResponse.json({ error: 'view must be where-used | explode | cost' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
