import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * FX Revaluation API Routes
 * GET  — List revaluation runs
 * POST — Execute revaluation
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FxRevaluationEngine } from '@/lib/fx-revaluation';

async function _GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // List recent FX revaluation journal entries
        const entries = await prisma.journalEntry.findMany({
            where: { reference: { startsWith: 'FX-REVAL' } },
            include: { lines: { include: { account: { select: { code: true, name: true } } } } },
            orderBy: { entryDate: 'desc' },
            take: 20
        });

        return NextResponse.json({ success: true, entries });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { periodEndDate } = body;

        const result = await FxRevaluationEngine.runRevaluation(
            1, // fiscalPeriodId
            'SAR', // baseCurrencyCode
            new Date(periodEndDate || new Date().toISOString().split('T')[0]),
            String((user as any).userId || (user as any).id || '')
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
