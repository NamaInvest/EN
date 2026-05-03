/**
 * Budget Control API Routes
 * GET  — Check budget availability / list budgets
 * POST — Budget actions (check, encumber, release)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { BudgetControlEngine } from '@/lib/budget-control';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        // Fetch budgets for the year
        const budgets = await prisma.budget.findMany({
            where: { year },
            include: { lines: { include: { account: { select: { code: true, name: true } } } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, budgets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, accountId, amount, periodEndDate, sourceDocType, sourceDocId } = body;

        switch (action) {
            case 'check': {
                if (!accountId || !amount) {
                    return NextResponse.json({ error: 'accountId and amount required' }, { status: 400 });
                }
                const result = await BudgetControlEngine.checkAvailability(accountId, amount);
                return NextResponse.json({ success: true, result });
            }

            case 'variance': {
                const variance = await BudgetControlEngine.getVarianceAnalysis(
                    periodEndDate || new Date().toISOString().split('T')[0]
                );
                return NextResponse.json({ success: true, variance });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
