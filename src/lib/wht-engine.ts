import { PrismaClient } from '@prisma/client';

export class WHTEngine {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Determines if an invoice requires WHT, and calculates the amount
     */
    async calculateWHT(invoiceId: number, isResident: boolean, serviceType: string) {
        const invoice = await this.prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { supplier: true }
        });

        if (!invoice || !invoice.supplierId) {
            throw new Error('Invoice or Supplier not found');
        }

        // 1. Find applicable WHT Rule
        const rule = await (this.prisma as any).wHTRule.findFirst({
            where: {
                serviceType: serviceType,
                isActive: true,
                effectiveFrom: { lte: invoice.date }
            },
            orderBy: { effectiveFrom: 'desc' }
        });

        if (!rule) {
            return { required: false, amount: 0, reason: 'No WHT rule found for this service' };
        }

        // 2. Calculate
        const rate = isResident ? rule.residentRate : rule.nonResidentRate;
        if (rate <= 0) return { required: false, amount: 0, reason: 'Rate is 0%' };

        const whtAmount = invoice.subtotal * (rate / 100);

        return {
            required: true,
            ruleId: rule.id,
            baseAmount: invoice.subtotal,
            whtRate: rate,
            whtAmount: whtAmount,
        };
    }

    /**
     * Applies WHT to an invoice and creates the Transaction record
     */
    async applyWHT(invoiceId: number, isResident: boolean, serviceType: string) {
        const calc = await this.calculateWHT(invoiceId, isResident, serviceType);
        
        if (!calc.required) return null;

        const invoice = await this.prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) throw new Error('Invoice not found');

        // Check if WHT already applied
        const existing = await (this.prisma as any).wHTTransaction.findFirst({
            where: { invoiceId }
        });
        if (existing) throw new Error('WHT already applied to this invoice');

        // Create WHT Transaction
        const whtTx = await (this.prisma as any).wHTTransaction.create({
            data: {
                vendorId: invoice.supplierId!,
                invoiceId: invoice.id,
                ruleId: calc.ruleId!,
                baseAmount: calc.baseAmount!,
                whtRate: calc.whtRate!,
                whtAmount: calc.whtAmount!
            }
        });

        // Normally we would also adjust the AP balance or generate a Journal Entry:
        // Debit AP (reducing vendor payable)
        // Credit WHT Payable (Liability)
        
        return whtTx;
    }

    /**
     * Get pending WHT transactions to pay to ZATCA
     */
    async getPendingWHTTransactions() {
        return (this.prisma as any).wHTTransaction.findMany({
            where: { paidToZATCA: false },
            include: {
                vendor: { select: { name: true, taxNumber: true } },
                invoice: { select: { invoiceNo: true, date: true } },
                rule: { select: { serviceType: true } }
            }
        });
    }

    /**
     * Mark WHT transactions as paid
     */
    async markAsPaid(transactionIds: number[], certificateNumber?: string) {
        return (this.prisma as any).wHTTransaction.updateMany({
            where: { id: { in: transactionIds } },
            data: {
                paidToZATCA: true,
                certificateNumber
            }
        });
    }
}
