import { prisma } from './prisma';

export class WHTEngine {
    
    /**
     * Calculate Withholding Tax for an Invoice before payment
     */
    static async calculateWHT(invoiceId: number, serviceType: string) {
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { supplier: true }
        });

        if (!invoice) throw new Error("Invoice not found");
        if (!invoice.supplierId) throw new Error("Invoice has no supplier");

        const isResident = true; // Typically derived from Supplier Profile/Country
        const baseAmount = invoice.subtotal; // WHT is usually applied on the net amount before VAT

        // Find Rule
        const rule = await prisma.wHTRule.findFirst({
            where: {
                countryCode: isResident ? 'SA' : 'OTHER',
                serviceType: serviceType
            }
        });

        if (!rule) return null;

        const rate = isResident ? rule.residentRate : rule.nonResidentRate;
        const whtAmount = baseAmount * rate;

        return {
            supplierId: invoice.supplierId,
            invoiceId,
            baseAmount,
            rate,
            whtAmount
        };
    }

    /**
     * Apply WHT and deduct from payment
     */
    static async applyWHT(invoiceId: number, serviceType: string, userId: string) {
        const calculation = await this.calculateWHT(invoiceId, serviceType);
        if (!calculation) return { ok: true, message: 'No WHT rule applies to this invoice.' };

        return prisma.$transaction(async (tx) => {
            // 1. Create WHT Transaction
            const whtTx = await tx.wHTTransaction.create({
                data: {
                    supplierId: calculation.supplierId,
                    invoiceId: calculation.invoiceId,
                    baseAmount: calculation.baseAmount,
                    whtRate: calculation.rate,
                    whtAmount: calculation.whtAmount,
                    certificateNumber: `WHT-${Date.now()}`
                }
            });

            // 2. Reduce the Invoice Remaining Amount by the WHT amount
            // Because the WHT is paid to ZATCA on behalf of the supplier.
            await tx.purchaseInvoice.update({
                where: { id: invoiceId },
                data: {
                    remaining: { decrement: calculation.whtAmount }
                }
            });

            // 3. Generate JE (Debit AP, Credit WHT Payable)
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `WHT-${whtTx.id}`,
                    entryDate: new Date().toISOString(),
                    description: `Withholding Tax Deduction for Invoice ${invoiceId}`,
                    status: 'posted',
                    totalDebit: calculation.whtAmount,
                    totalCredit: calculation.whtAmount,
                    createdBy: parseInt(userId, 10)
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 2010, // Mock AP Account
                    debit: calculation.whtAmount,
                    credit: 0,
                    description: 'AP Reduction due to WHT'
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 2050, // Mock WHT Payable Account
                    debit: 0,
                    credit: calculation.whtAmount,
                    description: 'WHT Payable to ZATCA'
                }
            });

            return whtTx;
        });
    }

    /**
     * List WHT transactions not yet paid to ZATCA
     */
    static async getPendingWHTTransactions() {
        return prisma.wHTTransaction.findMany({
            where: { paidToZATCA: false },
            include: { supplier: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    /**
     * Mark a batch of WHT transactions as paid to ZATCA (after submitting Form 14)
     */
    static async markAsPaid(transactionIds: number[], certificateNumber: string) {
        return prisma.wHTTransaction.updateMany({
            where: { id: { in: transactionIds } },
            data: {
                paidToZATCA: true,
                certificateNumber,
            },
        });
    }

    /**
     * Generate Monthly XML Return for ZATCA
     */
    static async generateZatcaReturn(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const transactions = await prisma.wHTTransaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                paidToZATCA: false
            },
            include: { supplier: true }
        });

        // In reality, this generates the exact ZATCA XML format for WHT submission
        let totalWHT = 0;
        transactions.forEach((t: any) => totalWHT += t.whtAmount);

        return {
            period: `${year}-${month}`,
            transactionCount: transactions.length,
            totalWHT,
            transactions
        };
    }
}
