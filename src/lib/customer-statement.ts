import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.customer-sta' });

export class CustomerStatementEngine {
    
    /**
     * Generate Customer Statement (Opening Balance + Transactions + Closing Balance + Aging)
     */
    static async generateStatement(customerId: number, fromDate: Date, toDate: Date, includeOnlyOpen = false) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) throw new Error("Customer not found");

        // 1. Calculate Opening Balance (before fromDate)
        // In reality, this relies on JournalLines for this customer's AR account
        // For demonstration, we aggregate Sales Invoices and Receipts prior to fromDate
        const priorInvoices = await prisma.salesInvoice.aggregate({
            where: { customerId, date: { lt: fromDate } },
            _sum: { subtotal: true, taxValue: true } // Assuming total is net + tax
        });
        
        const priorReceipts = await prisma.cashApplicationBatch.aggregate({
            where: { customerId, appliedAt: { lt: fromDate } },
            _sum: { totalReceived: true }
        });

        const priorInvTotal = n(priorInvoices._sum.subtotal) + n(priorInvoices._sum.taxValue);
        const priorRecTotal = Number(priorReceipts._sum?.totalReceived || 0);
        const openingBalance = priorInvTotal - priorRecTotal;

        // 2. Fetch Transactions in the period
        const periodInvoices = await prisma.salesInvoice.findMany({
            take: 100,
            where: {
                customerId,
                status: 'posted',
                date: { gte: fromDate, lte: toDate },
                ...(includeOnlyOpen ? { remaining: { gt: 0 } } : {})
            },
            orderBy: { date: 'asc' }
        });

        const periodReceipts = await prisma.cashApplicationBatch.findMany({
            take: 100,
            where: { customerId, appliedAt: { gte: fromDate, lte: toDate } },
            orderBy: { appliedAt: 'asc' }
        });

        // Merge and sort transactions by date
        const transactions: any[] = [];
        periodInvoices.forEach(inv => {
            const total = n(inv.subtotal) + n(inv.taxValue);
            transactions.push({
                type: 'INVOICE',
                id: inv.id,
                reference: `INV-${inv.invoiceNo}`,
                date: inv.date,
                amount: total,
                debit: total,
                credit: 0
            });
        });

        if (!includeOnlyOpen) {
            periodReceipts.forEach((rec: any) => {
                transactions.push({
                    type: 'RECEIPT',
                    id: rec.id,
                    reference: `REC-${rec.id}`,
                    date: rec.appliedAt,
                    amount: Number(rec.totalReceived),
                    debit: 0,
                    credit: Number(rec.totalReceived)
                });
            });
        }

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 3. Compute running balance
        let runningBalance = openingBalance;
        for (const t of transactions) {
            runningBalance = runningBalance + t.debit - t.credit;
            t.balance = runningBalance;
        }

        const closingBalance = runningBalance;

        // 4. Calculate Aging (for all open invoices up to toDate)
        const allOpenInvoices = await prisma.salesInvoice.findMany({
            take: 100,
            where: { customerId, status: 'posted', remaining: { gt: 0 }, date: { lte: toDate } }
        });

        const aging = {
            current: 0,
            thirtyDays: 0,
            sixtyDays: 0,
            ninetyDays: 0,
            overOneTwenty: 0
        };

        allOpenInvoices.forEach(inv => {
            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 30); // Mock 30-day term
            
            if (toDate <= dueDate) {
                aging.current += n(inv.remaining);
            } else {
                const diffDays = Math.ceil((toDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) aging.thirtyDays += n(inv.remaining);
                else if (diffDays <= 60) aging.sixtyDays += n(inv.remaining);
                else if (diffDays <= 90) aging.ninetyDays += n(inv.remaining);
                else aging.overOneTwenty += n(inv.remaining);
            }
        });

        return {
            customer: {
                id: customer.id,
                name: customer.name,
                nameAr: customer.name
            },
            statementPeriod: { from: fromDate, to: toDate },
            openingBalance,
            closingBalance,
            transactions,
            aging
        };
    }
}
