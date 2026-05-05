import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const asOfDateStr = searchParams.get('asOfDate');
        const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();

        // Fetch all accounts with their lines
        const accounts = await prisma.account.findMany({
            include: {
                journalLines: {
                    where: {
                        entry: {
                            status: 'POSTED',
                            date: { lte: asOfDate }
                        }
                    }
                }
            } as any
        });

        // Group into Assets, Liabilities, Equity
        const balanceSheet = {
            assets: { current: [] as any[], fixed: [] as any[], total: 0 },
            liabilities: { current: [] as any[], longTerm: [] as any[], total: 0 },
            equity: { items: [] as any[], total: 0 }
        };

        accounts.forEach(account => {
            const lines = (account as any).journalLines || [];
            const debits = lines.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0);
            const credits = lines.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0);
            
            // Typical Assets: 1xxxx
            if (account.code.startsWith('1')) {
                const balance = debits - credits; // Normal debit balance
                if (balance !== 0) {
                    const type = account.code.startsWith('11') || account.code.startsWith('12') ? 'current' : 'fixed';
                    balanceSheet.assets[type].push({ id: account.id, code: account.code, name: account.name, balance });
                    balanceSheet.assets.total += balance;
                }
            }
            // Typical Liabilities: 2xxxx
            else if (account.code.startsWith('2')) {
                const balance = credits - debits; // Normal credit balance
                if (balance !== 0) {
                    const type = account.code.startsWith('21') || account.code.startsWith('22') ? 'current' : 'longTerm';
                    balanceSheet.liabilities[type].push({ id: account.id, code: account.code, name: account.name, balance });
                    balanceSheet.liabilities.total += balance;
                }
            }
            // Equity: 3xxxx
            else if (account.code.startsWith('3')) {
                const balance = credits - debits; // Normal credit balance
                if (balance !== 0) {
                    balanceSheet.equity.items.push({ id: account.id, code: account.code, name: account.name, balance });
                    balanceSheet.equity.total += balance;
                }
            }
            // 4xxxx (Revenue) and 5xxxx (Expenses) go to Retained Earnings (Equity)
            else if (account.code.startsWith('4') || account.code.startsWith('5')) {
                const balance = account.code.startsWith('4') ? (credits - debits) : (debits - credits);
                if (balance !== 0) {
                    const isRevenue = account.code.startsWith('4');
                    // Add net income to equity total
                    balanceSheet.equity.total += isRevenue ? balance : -balance;
                }
            }
        });

        // Add a pseudo-item for Net Income in Equity for display
        const netIncome = balanceSheet.equity.total - balanceSheet.equity.items.reduce((s, i) => s + i.balance, 0);
        if (netIncome !== 0) {
            balanceSheet.equity.items.push({ id: 'net_income', code: '3999', name: 'Net Income (Year to Date)', balance: netIncome });
        }

        return NextResponse.json({ success: true, data: balanceSheet, asOfDate });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
