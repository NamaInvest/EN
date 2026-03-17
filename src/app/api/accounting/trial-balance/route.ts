import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - ميزان المراجعة
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Get all active accounts
        const accounts = await prisma.account.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });

        // Build date filter for journal entries
        const entryWhere: Record<string, unknown> = {};
        if (from) entryWhere.entryDate = { ...(entryWhere.entryDate as object || {}), gte: from };
        if (to) entryWhere.entryDate = { ...(entryWhere.entryDate as object || {}), lte: to };

        // Get all journal lines with optional date filter
        const allLines = await prisma.journalLine.findMany({
            where: { entry: entryWhere },
            select: { accountId: true, debit: true, credit: true },
        });

        // Group by account
        const linesByAccount: Record<number, { totalDebit: number; totalCredit: number }> = {};
        for (const line of allLines) {
            if (!linesByAccount[line.accountId]) {
                linesByAccount[line.accountId] = { totalDebit: 0, totalCredit: 0 };
            }
            linesByAccount[line.accountId].totalDebit += line.debit;
            linesByAccount[line.accountId].totalCredit += line.credit;
        }

        // Build trial balance rows
        let grandTotalDebit = 0;
        let grandTotalCredit = 0;

        const rows = accounts.map(acc => {
            const data = linesByAccount[acc.id] || { totalDebit: 0, totalCredit: 0 };
            const debit = Math.round(data.totalDebit * 100) / 100;
            const credit = Math.round(data.totalCredit * 100) / 100;

            // Calculate balance based on account type
            let debitBalance = 0;
            let creditBalance = 0;

            if (['asset', 'expense'].includes(acc.type)) {
                const net = debit - credit;
                if (net >= 0) debitBalance = net;
                else creditBalance = Math.abs(net);
            } else {
                const net = credit - debit;
                if (net >= 0) creditBalance = net;
                else debitBalance = Math.abs(net);
            }

            grandTotalDebit += debitBalance;
            grandTotalCredit += creditBalance;

            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                level: acc.level,
                totalDebit: debit,
                totalCredit: credit,
                debitBalance: Math.round(debitBalance * 100) / 100,
                creditBalance: Math.round(creditBalance * 100) / 100,
            };
        }).filter(r => r.totalDebit > 0 || r.totalCredit > 0 || r.debitBalance > 0 || r.creditBalance > 0);

        return NextResponse.json({
            rows,
            grandTotalDebit: Math.round(grandTotalDebit * 100) / 100,
            grandTotalCredit: Math.round(grandTotalCredit * 100) / 100,
            isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01,
        });
    } catch (error) {
        console.error('Trial balance error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء ميزان المراجعة' }, { status: 500 });
    }
}
