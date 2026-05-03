/**
 * Consolidation Engine API Routes
 * GET  — List consolidation runs / summary
 * POST — Run consolidation / review / post / reverse
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ConsolidationEngine } from '@/lib/consolidation-engine';

const db = prisma as any;

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');
        const action = searchParams.get('action') || 'list';

        if (action === 'summary' && runId) {
            const summary = await ConsolidationEngine.getConsolidationSummary(parseInt(runId));
            return NextResponse.json({ success: true, summary });
        }

        // List all runs
        const runs = await db.consolidationRun.findMany({
            include: { group: { select: { name: true, baseCurrency: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // List groups
        const groups = await db.consolidationGroup.findMany({
            where: { isActive: true }
        });

        return NextResponse.json({ success: true, runs, groups });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, groupId, fiscalPeriodId, runId } = body;

        switch (action) {
            case 'run':
                if (!groupId || !fiscalPeriodId) {
                    return NextResponse.json({ error: 'groupId and fiscalPeriodId are required' }, { status: 400 });
                }
                const result = await ConsolidationEngine.runConsolidation(groupId, fiscalPeriodId, String(user.id));
                return NextResponse.json({ success: true, result });

            case 'review':
                if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });
                await ConsolidationEngine.reviewConsolidation(runId);
                return NextResponse.json({ success: true, message: 'تم المراجعة' });

            case 'post':
                if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });
                await ConsolidationEngine.postConsolidation(runId);
                return NextResponse.json({ success: true, message: 'تم الترحيل' });

            case 'reverse':
                if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });
                await ConsolidationEngine.reverseConsolidation(runId);
                return NextResponse.json({ success: true, message: 'تم العكس' });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
