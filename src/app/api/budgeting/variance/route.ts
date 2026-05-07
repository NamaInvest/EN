import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { BudgetControlEngine } from '@/lib/budget-control';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const budgetIdStr = url.searchParams.get('budgetId');

        const engine = new BudgetControlEngine(prisma);

        if (budgetIdStr) {
            const analysis = await engine.getVarianceAnalysis(parseInt(budgetIdStr));
            return NextResponse.json(analysis);
        }

        // Return all budgets analysis if no specific budgetId is passed
        const activeBudgets = await prisma.budget.findMany({
            take: 100,
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
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
