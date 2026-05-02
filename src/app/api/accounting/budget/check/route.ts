import { NextResponse } from 'next/server';
import { BudgetEngine } from '@/lib/budget-engine';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accountId, costCenterId, newAmount, date } = body;

        if (!accountId || !newAmount || !date) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await BudgetEngine.checkBudget(
            parseInt(accountId),
            costCenterId ? parseInt(costCenterId) : null,
            parseFloat(newAmount),
            new Date(date)
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        // If strict budgeting throws an error
        return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
}
