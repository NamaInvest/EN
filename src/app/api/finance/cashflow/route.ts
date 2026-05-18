import { NextRequest, NextResponse } from 'next/server';
import { CashflowDirectEngine } from '@/lib/cashflow-direct-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
    await CashflowDirectEngine.buildStatement(tenant, period);
    const data = await CashflowDirectEngine.buildStatement(tenant, period);
    return NextResponse.json({ data });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
