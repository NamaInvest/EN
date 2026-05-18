import { NextRequest, NextResponse } from 'next/server';
import { EquityStatementEngine } from '@/lib/equity-statement-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
    const layer    = searchParams.get('layer') ?? 'BOOK';
    const data = await EquityStatementEngine.generate(tenant, period, layer);
    return NextResponse.json({ data });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
