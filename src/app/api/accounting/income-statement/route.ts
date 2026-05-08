import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

// GET - قائمة الدخل (Revenue - Expenses = Net Profit)
import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from') || new Date().getFullYear() + '-01-01';
        const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

        // Get revenue accounts (4xxx)
        const revenueAccounts = await prisma.account.findMany({
            take: 100,
            where: { type: 'revenue', isActive: true },
            orderBy: { code: 'asc' },
        });

        // Get expense accounts (5xxx)
        const expenseAccounts = await prisma.account.findMany({
            take: 100,
            where: { type: 'expense', isActive: true },
            orderBy: { code: 'asc' },
        });

        // Get all journal lines in date range
        const lines = await prisma.journalLine.findMany({
            take: 100,
            where: {
                entry: { entryDate: { gte: from, lte: to } },
            },
            select: { accountId: true, debit: true, credit: true },
        });

        // Aggregate by account
        const balances: Record<number, number> = {};
        for (const line of lines) {
            if (!balances[line.accountId]) balances[line.accountId] = 0;
            balances[line.accountId] += n(line.credit) - n(line.debit); // normal credit for revenue, will flip for expenses
        }

        // Revenue section
        let totalRevenue = 0;
        const revenueRows = revenueAccounts.map(acc => {
            const balance = Math.round((balances[acc.id] || 0) * 100) / 100;
            totalRevenue += balance;
            return { code: acc.code, name: acc.name, amount: balance };
        }).filter(r => r.amount !== 0);

        // Expense section (flip sign: expenses have debit normal balance)
        let totalExpenses = 0;
        const expenseRows = expenseAccounts.map(acc => {
            const balance = Math.round(((balances[acc.id] || 0) * -1) * 100) / 100; // flip for expenses
            totalExpenses += balance;
            return { code: acc.code, name: acc.name, amount: balance };
        }).filter(r => r.amount !== 0);

        const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

        return NextResponse.json({
            period: { from, to },
            revenue: {
                items: revenueRows,
                total: Math.round(totalRevenue * 100) / 100,
            },
            expenses: {
                items: expenseRows,
                total: Math.round(totalExpenses * 100) / 100,
            },
            netProfit,
            isProfitable: netProfit >= 0,
        });
    } catch (error: any) {
        console.error('Income statement error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء قائمة الدخل' }, { status: 500 });
    }
}
