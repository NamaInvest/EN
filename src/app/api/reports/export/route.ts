import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

/**
 * GET /api/reports/export?type=trial-balance|income-statement|balance-sheet&format=csv&from=&to=
 * Export financial reports in CSV format (Excel-compatible with Arabic support)
 */
export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const reportType = searchParams.get('type') || 'trial-balance';
        const format = searchParams.get('format') || 'csv';
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        // Get company info for header
        const company = await prisma.company.findFirst().catch(() => null);
        const companyName = company?.name || 'نما انفست';

        let csvContent = '';
        let filename = '';

        if (reportType === 'trial-balance') {
            filename = `trial_balance_${new Date().toISOString().slice(0, 10)}`;
            const accounts = await prisma.account.findMany({
            take: 100, orderBy: { code: 'asc' } });

            const dateFilter: any = {};
            if (fromDate || toDate) {
                dateFilter.entry = {};
                if (fromDate) dateFilter.entry = { entryDate: { gte: fromDate } };
                if (toDate) dateFilter.entry = { ...dateFilter.entry, entryDate: { ...(dateFilter.entry?.entryDate || {}), lte: toDate } };
            }

            const lines = await prisma.journalLine.findMany({
            take: 100,
                where: dateFilter,
                select: { accountId: true, debit: true, credit: true },
            });

            const totals: Record<number, { d: number; c: number }> = {};
            lines.forEach(l => {
                if (!totals[l.accountId]) totals[l.accountId] = { d: 0, c: 0 };
                totals[l.accountId].d += l.debit || 0;
                totals[l.accountId].c += l.credit || 0;
            });

            csvContent = `${companyName}\r\n`;
            csvContent += `ميزان المراجعة${fromDate ? ' من ' + fromDate : ''}${toDate ? ' إلى ' + toDate : ''}\r\n\r\n`;
            csvContent += `كود الحساب,اسم الحساب,النوع,مدين,دائن,الرصيد\r\n`;

            let totalDebit = 0, totalCredit = 0;
            accounts.forEach(acc => {
                const t = totals[acc.id] || { d: 0, c: 0 };
                const net = (acc.type === 'asset' || acc.type === 'expense') ? t.d - t.c : t.c - t.d;
                totalDebit += t.d;
                totalCredit += t.c;
                csvContent += `${acc.code},${acc.name},${acc.type},${t.d.toFixed(2)},${t.c.toFixed(2)},${net.toFixed(2)}\r\n`;
            });
            csvContent += `\r\n,الإجمالي,,${totalDebit.toFixed(2)},${totalCredit.toFixed(2)},${(totalDebit - totalCredit).toFixed(2)}\r\n`;

        } else if (reportType === 'income-statement') {
            filename = `income_statement_${new Date().toISOString().slice(0, 10)}`;
            const accounts = await prisma.account.findMany({
            take: 100,
                where: { type: { in: ['revenue', 'expense'] } },
                orderBy: { code: 'asc' },
            });
            const lines = await prisma.journalLine.findMany({
            take: 100,
                where: { accountId: { in: accounts.map(a => a.id) } },
                select: { accountId: true, debit: true, credit: true },
            });
            const totals: Record<number, { d: number; c: number }> = {};
            lines.forEach(l => {
                if (!totals[l.accountId]) totals[l.accountId] = { d: 0, c: 0 };
                totals[l.accountId].d += l.debit || 0;
                totals[l.accountId].c += l.credit || 0;
            });

            csvContent = `${companyName}\r\nقائمة الدخل\r\n\r\n`;
            csvContent += `كود الحساب,اسم الحساب,النوع,المبلغ\r\n`;
            let totalRevenue = 0, totalExpense = 0;
            accounts.forEach(acc => {
                const t = totals[acc.id] || { d: 0, c: 0 };
                const amount = acc.type === 'revenue' ? t.c - t.d : t.d - t.c;
                if (acc.type === 'revenue') totalRevenue += amount;
                else totalExpense += amount;
                csvContent += `${acc.code},${acc.name},${acc.type === 'revenue' ? 'إيراد' : 'مصروف'},${amount.toFixed(2)}\r\n`;
            });
            csvContent += `\r\n,إجمالي الإيرادات,,${totalRevenue.toFixed(2)}\r\n`;
            csvContent += `,إجمالي المصروفات,,${totalExpense.toFixed(2)}\r\n`;
            csvContent += `,صافي الربح (الخسارة),,${(totalRevenue - totalExpense).toFixed(2)}\r\n`;

        } else if (reportType === 'balance-sheet') {
            filename = `balance_sheet_${new Date().toISOString().slice(0, 10)}`;
            const accounts = await prisma.account.findMany({
            take: 100,
                where: { type: { in: ['asset', 'liability', 'equity'] } },
                orderBy: { code: 'asc' },
            });

            csvContent = `${companyName}\r\nالميزانية العمومية\r\n\r\n`;
            csvContent += `كود الحساب,اسم الحساب,النوع,الرصيد\r\n`;
            let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
            accounts.forEach(acc => {
                if (acc.type === 'asset') totalAssets += acc.balance;
                else if (acc.type === 'liability') totalLiabilities += acc.balance;
                else totalEquity += acc.balance;
                const typeAr = acc.type === 'asset' ? 'أصل' : acc.type === 'liability' ? 'التزام' : 'حقوق ملكية';
                csvContent += `${acc.code},${acc.name},${typeAr},${acc.balance.toFixed(2)}\r\n`;
            });
            csvContent += `\r\n,إجمالي الأصول,,${totalAssets.toFixed(2)}\r\n`;
            csvContent += `,إجمالي الالتزامات + حقوق الملكية,,${(totalLiabilities + totalEquity).toFixed(2)}\r\n`;
        }

        // BOM for Excel to detect UTF-8 Arabic
        const BOM = '\uFEFF';
        const csvBytes = new TextEncoder().encode(BOM + csvContent);

        return new NextResponse(csvBytes, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}.csv"`,
            },
        });
    } catch (e: any) {
        console.error('[Report Export]', e);
        return NextResponse.json({ error: 'فشل تصدير التقرير' }, { status: 500 });
    }
}
