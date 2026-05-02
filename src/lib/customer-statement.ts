import { prisma } from './prisma';

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
            where: { customerId, status: 'posted', date: { lt: fromDate } },
            _sum: { netAmount: true, taxAmount: true } // Assuming total is net + tax
        });
        
        const priorReceipts = await prisma.receipt.aggregate({
            where: { customerId, status: 'posted', date: { lt: fromDate } },
            _sum: { amount: true }
        });

        const priorInvTotal = (priorInvoices._sum.netAmount || 0) + (priorInvoices._sum.taxAmount || 0);
        const priorRecTotal = (priorReceipts._sum.amount || 0);
        const openingBalance = priorInvTotal - priorRecTotal;

        // 2. Fetch Transactions in the period
        const periodInvoices = await prisma.salesInvoice.findMany({
            where: {
                customerId,
                status: 'posted',
                date: { gte: fromDate, lte: toDate },
                ...(includeOnlyOpen ? { remaining: { gt: 0 } } : {})
            },
            orderBy: { date: 'asc' }
        });

        const periodReceipts = await prisma.receipt.findMany({
            where: {
                customerId,
                status: 'posted',
                date: { gte: fromDate, lte: toDate }
            },
            orderBy: { date: 'asc' }
        });

        // Merge and sort transactions by date
        const transactions: any[] = [];
        periodInvoices.forEach(inv => {
            const total = inv.netAmount + inv.taxAmount;
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
            periodReceipts.forEach(rec => {
                transactions.push({
                    type: 'RECEIPT',
                    id: rec.id,
                    reference: `REC-${rec.receiptNo}`,
                    date: rec.date,
                    amount: rec.amount,
                    debit: 0,
                    credit: rec.amount
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
                aging.current += inv.remaining;
            } else {
                const diffDays = Math.ceil((toDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) aging.thirtyDays += inv.remaining;
                else if (diffDays <= 60) aging.sixtyDays += inv.remaining;
                else if (diffDays <= 90) aging.ninetyDays += inv.remaining;
                else aging.overOneTwenty += inv.remaining;
            }
        });

        return {
            customer: {
                id: customer.id,
                name: customer.name,
                nameAr: customer.nameAr
            },
            statementPeriod: { from: fromDate, to: toDate },
            openingBalance,
            closingBalance,
            transactions,
            aging
        };
    }
}
