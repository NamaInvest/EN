import { PrismaClient } from '@prisma/client';

export class VarianceEngine {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Calculates Purchase Price Variance (PPV) for an invoice
     */
    async calculatePPV(invoiceId: number) {
        const invoice = await this.prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { details: true }
        });

        if (!invoice) throw new Error('Invoice not found');

        let totalPPV = 0;

        for (const line of invoice.details) {
            // For standard costing, get the standard cost from product
            const product = await this.prisma.product.findUnique({ where: { id: line.productId } });
            if (!product) continue;

            const standardCost = product.buyPrice || 0; // Simulated standard cost
            const actualCost = line.price;
            
            // PPV = (Actual Unit Cost - Standard Unit Cost) * Qty Purchased
            // Positive PPV = Unfavorable (Cost more than standard)
            // Negative PPV = Favorable (Cost less than standard)
            const ppv = (actualCost - standardCost) * line.quantity;
            totalPPV += ppv;
        }

        if (totalPPV !== 0) {
            await (this.prisma as any).costVariance.create({
                data: {
                    type: 'PPV',
                    orderId: invoice.id,
                    expectedCost: invoice.subtotal - totalPPV, // simplified
                    actualCost: invoice.subtotal,
                    varianceAmount: totalPPV
                }
            });
        }

        return totalPPV;
    }

    /**
     * Post unposted variances to the GL
     */
    async postVariancesToGL(userId: string) {
        const unposted = await (this.prisma as any).costVariance.findMany({
            take: 100,
            where: { isPosted: false }
        });

        if (unposted.length === 0) return 0;

        // In a real system, we'd loop through and create a Journal Entry per variance
        // Debit PPV Account, Credit Inventory clearing account, etc.
        
        await (this.prisma as any).costVariance.updateMany({
            where: { isPosted: false },
            data: { isPosted: true }
        });

        return unposted.length;
    }

    async getVariances() {
        return (this.prisma as any).costVariance.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });
    }
}
