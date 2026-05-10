import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Project EVM API
 * GET /api/projects/evm?projectId=X — EVM metrics for one project
 * GET /api/projects/evm?view=portfolio — Portfolio dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { WBSEngine } from '@/lib/wbs-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'projects.evm' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    const projectId = req.nextUrl.searchParams.get('projectId');

    try {
        if (view === 'portfolio') {
            const metrics = await WBSEngine.portfolioEVM(prisma);
            return NextResponse.json(metrics);
        }

        if (projectId) {
            const evm = await WBSEngine.calculateEVM(prisma, parseInt(projectId));
            return NextResponse.json(evm);
        }

        return NextResponse.json({ error: 'مطلوب: projectId أو view=portfolio' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
