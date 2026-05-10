import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { BudgetEngine } from '@/lib/budget-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.budget.variance' });

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const budgetId = searchParams.get('budgetId');

        if (!budgetId) {
            return NextResponse.json({ error: 'Missing budgetId' }, { status: 400 });
        }

        const report = await BudgetEngine.getVarianceReport(parseInt(budgetId, 10));

        return NextResponse.json({ success: true, report });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
