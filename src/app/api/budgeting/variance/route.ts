import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { BudgetControlEngine } from '@/lib/budget-control';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'budgeting.variance' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const budgetIdStr = url.searchParams.get('budgetId');

        const engine = new BudgetControlEngine(prisma);

        if (budgetIdStr) {
            const analysis = await engine.getVarianceAnalysis(parseInt(budgetIdStr));
            return NextResponse.json(analysis);
        }

        // Return all budgets analysis if no specific budgetId is passed
        const activeBudgets = await prisma.budget.findMany({ take: 100,
            where: { status: 'APPROVED' },
            select: { id: true }
        });

        const results = [];
        for (const b of activeBudgets) {
            const analysis = await engine.getVarianceAnalysis(b.id);
            results.push(analysis);
        }

        return NextResponse.json(results);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
