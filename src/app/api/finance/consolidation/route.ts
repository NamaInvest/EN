import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Consolidation Engine API Routes
 * GET  — List consolidation runs / summary
 * POST — Run consolidation / review / post / reverse
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ConsolidationEngine } from '@/lib/consolidation-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.consolidation' });

const db = prisma as any;

async function _GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
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
            take: 100,
            where: { isActive: true }
        });

        return NextResponse.json({ success: true, runs, groups });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  groupId: z.union([z.string(), z.number()]).optional(),
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
  runId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, groupId, fiscalPeriodId, runId } = body;

        switch (action) {
            case 'run':
                if (!groupId || !fiscalPeriodId) {
                    return NextResponse.json({ error: 'groupId and fiscalPeriodId are required' }, { status: 400 });
                }
                // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
