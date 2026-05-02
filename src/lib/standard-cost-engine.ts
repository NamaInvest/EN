import { prisma } from './prisma';

export class StandardCostEngine {
    
    /**
     * Set a new standard cost version for a product
     */
    static async setStandardCost(productId: number, materialCost: number, laborCost: number, overheadCost: number) {
        // Deactivate old active version
        await prisma.standardCostVersion.updateMany({
            where: { productId, isActive: true },
            data: { isActive: false }
        });

        const totalStdCost = materialCost + laborCost + overheadCost;

        // Create new active version
        const newCost = await prisma.standardCostVersion.create({
            data: {
                productId,
                effectiveFrom: new Date(),
                materialCost,
                laborCost,
                overheadCost,
                totalStdCost,
                isActive: true
            }
        });

        return newCost;
    }

    /**
     * Post Purchase Price Variance (PPV) at Goods Receipt (GRN)
     */
    static async postPurchasePriceVariance(productId: number, actualPrice: number, quantity: number, userId: string) {
        const stdCost = await prisma.standardCostVersion.findFirst({
            where: { productId, isActive: true }
        });

        if (!stdCost) return null;

        const expectedPrice = stdCost.materialCost;
        const varianceAmount = (actualPrice - expectedPrice) * quantity;

        if (varianceAmount === 0) return null;

        const isUnfavorable = varianceAmount > 0;

        return prisma.$transaction(async (tx) => {
            const varianceTx = await tx.varianceTransaction.create({
                data: {
                    type: 'PURCHASE_PRICE',
                    productId,
                    amount: Math.abs(varianceAmount),
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount)
                }
            });

            // Generate Journal Entry
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `PPV-${varianceTx.id}`,
                    entryDate: new Date().toISOString(),
                    description: `Purchase Price Variance for Product ${productId}`,
                    status: 'posted',
                    totalDebit: Math.abs(varianceAmount),
                    totalCredit: Math.abs(varianceAmount),
                    createdBy: parseInt(userId, 10)
                }
            });

            // Debit/Credit mapping
            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 5020, // Mock: Purchase Price Variance Account
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    description: 'PPV'
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 1040, // Mock: Inventory AP Accrual
                    debit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    credit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    description: 'Offset'
                }
            });

            return varianceTx;
        });
    }

    /**
     * Post Material Usage Variance at MO Material Issuance
     */
    static async postMaterialUsageVariance(productId: number, manufacturingOrderId: number, expectedQty: number, actualQty: number, userId: string) {
        const stdCost = await prisma.standardCostVersion.findFirst({
            where: { productId, isActive: true }
        });

        if (!stdCost) return null;

        const stdPrice = stdCost.materialCost;
        const varianceAmount = (actualQty - expectedQty) * stdPrice;

        if (varianceAmount === 0) return null;

        const isUnfavorable = varianceAmount > 0;

        return prisma.$transaction(async (tx) => {
            const varianceTx = await tx.varianceTransaction.create({
                data: {
                    type: 'MATERIAL_USAGE',
                    productId,
                    manufacturingOrderId,
                    amount: Math.abs(varianceAmount),
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount)
                }
            });

            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `MUV-${varianceTx.id}`,
                    entryDate: new Date().toISOString(),
                    description: `Material Usage Variance for MO ${manufacturingOrderId}`,
                    status: 'posted',
                    totalDebit: Math.abs(varianceAmount),
                    totalCredit: Math.abs(varianceAmount),
                    createdBy: parseInt(userId, 10)
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 5030, // Mock: Material Usage Variance Account
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    description: 'MUV'
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 1050, // Mock: WIP Inventory
                    debit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    credit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    description: 'Offset WIP'
                }
            });

            return varianceTx;
        });
    }
}
