import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        // Fetch all accounts
        const accounts = await prisma.account.findMany({
            take: 100,
            orderBy: { code: 'asc' }
        });

        // Fetch all journal lines within the period
        const dateFilter: any = {};
        if (fromDate || toDate) {
            dateFilter.journalEntry = {};
            if (fromDate) dateFilter.journalEntry.entryDate = { gte: fromDate };
            if (toDate) dateFilter.journalEntry.entryDate = { ...dateFilter.journalEntry.entryDate, lte: toDate };
        }

        const lines = await prisma.journalLine.findMany({
            take: 100,
            where: dateFilter,
            select: { accountId: true, debit: true, credit: true }
        });

        // Compute running totals
        const accountTotals: Record<number, { debit: number, credit: number }> = {};
        
        lines.forEach(line => {
            if (!accountTotals[line.accountId]) {
                accountTotals[line.accountId] = { debit: 0, credit: 0 };
            }
            accountTotals[line.accountId].debit += line.debit || 0;
            accountTotals[line.accountId].credit += line.credit || 0;
        });

        // Merge back into accounts
        const processedAccounts = accounts.map(acc => {
            const totals = accountTotals[acc.id] || { debit: 0, credit: 0 };
            return {
                ...acc,
                periodDebit: totals.debit,
                periodCredit: totals.credit,
                netBalance: (acc.type === 'asset' || acc.type === 'expense') 
                    ? totals.debit - totals.credit 
                    : totals.credit - totals.debit
            };
        });

        return NextResponse.json({ accounts: processedAccounts }, { status: 200 });

    } catch (e: any) {
        console.error("Trial Balance API Error:", e);
        return NextResponse.json({ error: 'Failed to generate Trial Balance' }, { status: 500 });
    }
}
