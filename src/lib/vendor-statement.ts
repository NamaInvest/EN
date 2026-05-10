import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vendor-statement' });

export class VendorStatementEngine {
    
    /**
     * Generate Vendor Statement (Opening Balance + Transactions + Closing Balance + Aging)
     */
    static async generateStatement(vendorId: number, fromDate: Date, toDate: Date, includeOnlyOpen = false) {
        // Vendors are stored in the Customer model
        const vendor = await prisma.customer.findUnique({
            where: { id: vendorId }
        });

        if (!vendor) throw new Error("Vendor not found");

        // 1. Calculate Opening Balance (before fromDate)
        const priorInvoices = await prisma.purchaseInvoice.aggregate({
            where: { supplierId: vendorId, status: 'posted', date: { lt: fromDate } },
            _sum: { subtotal: true, taxValue: true, paid: true } 
        });

        const priorInvTotal = n(priorInvoices._sum.subtotal) + n(priorInvoices._sum.taxValue);
        const priorPayTotal = n(priorInvoices._sum.paid);
        // Balance is what we owe: Invoices - Payments
        const openingBalance = priorInvTotal - priorPayTotal;

        // 2. Fetch Transactions in the period
        const periodInvoices = await prisma.purchaseInvoice.findMany({
            take: 100,
            where: {
                supplierId: vendorId,
                status: 'posted',
                date: { gte: fromDate, lte: toDate }
            },
            orderBy: { date: 'asc' }
        });

        // Merge and sort transactions by date
        const transactions: any[] = [];
        periodInvoices.forEach(inv => {
            const total = n(inv.subtotal) + n(inv.taxValue);
            transactions.push({
                type: 'INVOICE',
                id: inv.id,
                reference: `PINV-${inv.invoiceNo}`,
                date: inv.date,
                amount: total,
                credit: total, // we owe them -> credit to their AP account
                debit: 0
            });

            if (!includeOnlyOpen && n(inv.paid) > 0) {
                transactions.push({
                    type: 'PAYMENT',
                    id: inv.id,
                    reference: `PAY-PINV-${inv.invoiceNo}`,
                    date: inv.date, // Approximate payment date to invoice date
                    amount: n(inv.paid),
                    debit: n(inv.paid), // we paid them -> debit their AP account
                    credit: 0
                });
            }
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 3. Compute running balance (Credit balance)
        let runningBalance = openingBalance;
        for (const t of transactions) {
            runningBalance = runningBalance + t.credit - t.debit;
            t.balance = runningBalance;
        }

        const closingBalance = runningBalance;

        // 4. Calculate Aging
        const aging = {
            current: 0,
            thirtyDays: 0,
            sixtyDays: 0,
            ninetyDays: 0,
            overOneTwenty: 0
        };

        periodInvoices.forEach(inv => {
            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 30); // Mock 30-day term
            const remaining = (n(inv.subtotal) + n(inv.taxValue)) - n(inv.paid);
            
            if (remaining > 0) {
                if (toDate <= dueDate) {
                    aging.current += remaining;
                } else {
                    const diffDays = Math.ceil((toDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) aging.thirtyDays += remaining;
                    else if (diffDays <= 60) aging.sixtyDays += remaining;
                    else if (diffDays <= 90) aging.ninetyDays += remaining;
                    else aging.overOneTwenty += remaining;
                }
            }
        });

        return {
            vendor: {
                id: vendor.id,
                name: vendor.name,
                nameAr: vendor.name
            },
            statementPeriod: { from: fromDate, to: toDate },
            openingBalance,
            closingBalance,
            transactions,
            aging
        };
    }
}
