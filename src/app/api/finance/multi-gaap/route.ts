import { NextRequest, NextResponse } from 'next/server';
import { MultiGAAPEngine } from '@/lib/multi-gaap-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    const entry = await MultiGAAPEngine.recordAdjustment(body);
    return NextResponse.json({ entry }, { status: 201 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const baseBookId   = Number(searchParams.get('baseBookId') ?? 1);
    const compareBookId = Number(searchParams.get('compareBookId') ?? 2);
    const reconciliation = await MultiGAAPEngine.reconcileBooks(tenant, baseBookId, compareBookId);
    return NextResponse.json({ reconciliation });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
