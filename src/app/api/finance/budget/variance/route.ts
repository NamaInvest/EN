import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { BudgetEngine } from '@/lib/budget-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.budget.variance' });

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const budgetIdParam = searchParams.get('budgetId');
        
        let budgetId: number;

        if (budgetIdParam) {
            budgetId = parseInt(budgetIdParam);
        } else {
            // Pick the first active budget if not specified
            const activeBudget = await prisma.budget.findFirst({
                where: { status: 'APPROVED' },
                orderBy: { id: 'desc' }
            });
            if (!activeBudget) {
                return NextResponse.json([]); // No budget found
            }
            budgetId = activeBudget.id;
        }

        const report = await BudgetEngine.getVarianceReport(budgetId);
        return NextResponse.json(report);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
