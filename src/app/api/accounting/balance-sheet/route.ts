import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

// GET - الميزانية العمومية (Assets = Liabilities + Equity)
import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const asOf = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Get all accounts
        const allAccounts = await prisma.account.findMany({
            take: 100,
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });

        // Get all journal lines up to date
        const lines = await prisma.journalLine.findMany({
            take: 100,
            where: {
                entry: { entryDate: { lte: asOf } },
            },
            select: { accountId: true, debit: true, credit: true },
        });

        // Aggregate balances
        const rawBalances: Record<number, { debit: number; credit: number }> = {};
        for (const line of lines) {
            if (!rawBalances[line.accountId]) rawBalances[line.accountId] = { debit: 0, credit: 0 };
            rawBalances[line.accountId].debit += n(line.debit);
            rawBalances[line.accountId].credit += n(line.credit);
        }

        // Calculate net balances
        function getBalance(acc: { id: number; type: string }): number {
            const raw = rawBalances[acc.id] || { debit: 0, credit: 0 };
            if (['asset', 'expense'].includes(acc.type)) {
                return Math.round((raw.debit - raw.credit) * 100) / 100;
            }
            return Math.round((raw.credit - raw.debit) * 100) / 100;
        }

        // Assets
        const assetAccounts = allAccounts.filter(a => a.type === 'asset');
        let totalAssets = 0;
        const assets = assetAccounts.map(acc => {
            const balance = getBalance(acc);
            totalAssets += balance;
            return { code: acc.code, name: acc.name, level: acc.level, balance };
        }).filter(r => r.balance !== 0);

        // Liabilities
        const liabilityAccounts = allAccounts.filter(a => a.type === 'liability');
        let totalLiabilities = 0;
        const liabilities = liabilityAccounts.map(acc => {
            const balance = getBalance(acc);
            totalLiabilities += balance;
            return { code: acc.code, name: acc.name, level: acc.level, balance };
        }).filter(r => r.balance !== 0);

        // Equity
        const equityAccounts = allAccounts.filter(a => a.type === 'equity');
        let totalEquity = 0;
        const equity = equityAccounts.map(acc => {
            const balance = getBalance(acc);
            totalEquity += balance;
            return { code: acc.code, name: acc.name, level: acc.level, balance };
        }).filter(r => r.balance !== 0);

        // Calculate retained earnings (net profit from revenue - expenses)
        const revenueExpenseAccounts = allAccounts.filter(a => ['revenue', 'expense'].includes(a.type));
        let revenue = 0;
        let expenses = 0;

        for (const acc of revenueExpenseAccounts) {
            const raw = rawBalances[acc.id] || { debit: 0, credit: 0 };
            if (acc.type === 'revenue') {
                revenue += (raw.credit - raw.debit);
            } else if (acc.type === 'expense') {
                expenses += (raw.debit - raw.credit);
            }
        }
        
        let retainedEarnings = Math.round((revenue - expenses) * 100) / 100;
        totalEquity += retainedEarnings;

        totalAssets = Math.round(totalAssets * 100) / 100;
        totalLiabilities = Math.round(totalLiabilities * 100) / 100;
        totalEquity = Math.round(totalEquity * 100) / 100;

        return NextResponse.json({
            asOf,
            assets: { items: assets, total: totalAssets },
            liabilities: { items: liabilities, total: totalLiabilities },
            equity: {
                items: [...equity, ...(retainedEarnings !== 0 ? [{ code: '3200', name: 'صافي الأرباح المحتجزة', level: 1, balance: retainedEarnings }] : [])],
                total: totalEquity,
            },
            totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        });
    } catch (error: any) {
        console.error('Balance sheet error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الميزانية العمومية' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
