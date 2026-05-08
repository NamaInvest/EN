import { NextResponse } from 'next/server';
import { BudgetEngine } from '@/lib/budget-engine';

export async function GET(req: Request) {

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
