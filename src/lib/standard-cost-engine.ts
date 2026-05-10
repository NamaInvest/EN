import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.standard-cos' });

export class StandardCostEngine {
    
    private static async _getAccountId(codeOrKey: string, fallbackId: number): Promise<number> {
        // First try to check if it's stored in settings (e.g. key like 'acc_ppv')
        const setting = await prisma.setting.findUnique({ where: { key: codeOrKey } });
        const codeToSearch = setting?.value || codeOrKey;
        
        const acc = await prisma.account.findFirst({ where: { code: codeToSearch } });
        return acc ? acc.id : fallbackId;
    }
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
        const varianceAmount = (actualPrice - n(expectedPrice)) * quantity;

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

            const ppvAccountId = await StandardCostEngine._getAccountId('acc_ppv', 5020);
            const apAccrualAccountId = await StandardCostEngine._getAccountId('acc_ap_accrual', 1040);

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
                    accountId: ppvAccountId,
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    description: 'PPV'
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: apAccrualAccountId,
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
        const varianceAmount = (actualQty - expectedQty) * n(stdPrice);

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

            const muvAccountId = await StandardCostEngine._getAccountId('acc_muv', 5030);
            const wipAccountId = await StandardCostEngine._getAccountId('acc_wip', 1050);

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
                    accountId: muvAccountId,
                    debit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    credit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    description: 'MUV'
                }
            });

            await tx.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: wipAccountId,
                    debit: isUnfavorable ? 0 : Math.abs(varianceAmount),
                    credit: isUnfavorable ? Math.abs(varianceAmount) : 0,
                    description: 'Offset WIP'
                }
            });

            return varianceTx;
        });
    }
}
