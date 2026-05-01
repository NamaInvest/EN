import { prisma } from './prisma';

export class FixedAssetsEngine {
    
    /**
     * Capitalizes a CWIP (Capital Work In Progress) asset into service
     */
    static async capitalizeAsset(assetId: number, placedInServiceDate: Date) {
        const asset = await prisma.fixedAssetAdvanced.findUnique({ where: { id: assetId } });
        if (!asset || asset.status !== 'CWIP') throw new Error("Asset is not in CWIP status");

        await prisma.fixedAssetAdvanced.update({
            where: { id: assetId },
            data: {
                status: 'ACTIVE',
                placedInService: placedInServiceDate
            }
        });

        // Generate Journal Entry: DR Asset Account, CR CWIP Account
        return true;
    }

    /**
     * Runs depreciation for a specific fiscal period
     */
    static async runDepreciation(fiscalPeriodDate: Date) {
        // Find all active assets that have been placed in service
        const assets = await prisma.fixedAssetAdvanced.findMany({
            where: {
                status: 'ACTIVE',
                placedInService: { lte: fiscalPeriodDate }
            }
        });

        let depreciatedCount = 0;

        for (const asset of assets) {
            if (Number(asset.netBookValue) <= Number(asset.salvageValue)) continue;

            let depreciationAmount = 0;

            if (asset.depreciationMethod === 'STRAIGHT_LINE') {
                const depreciableBase = Number(asset.purchaseCost) - Number(asset.salvageValue);
                const annualDepreciation = depreciableBase / asset.usefulLifeYears;
                depreciationAmount = annualDepreciation / 12; // Monthly
            } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
                const rate = 1 / asset.usefulLifeYears;
                const annualDepreciation = Number(asset.netBookValue) * rate;
                depreciationAmount = annualDepreciation / 12; // Monthly
            } else if (asset.depreciationMethod === 'DOUBLE_DECLINING') {
                const rate = (1 / asset.usefulLifeYears) * 2;
                const annualDepreciation = Number(asset.netBookValue) * rate;
                depreciationAmount = annualDepreciation / 12; // Monthly
            }

            // Don't depreciate below salvage value
            if (Number(asset.netBookValue) - depreciationAmount < Number(asset.salvageValue)) {
                depreciationAmount = Number(asset.netBookValue) - Number(asset.salvageValue);
            }

            if (depreciationAmount > 0) {
                // Update Asset
                await prisma.fixedAssetAdvanced.update({
                    where: { id: asset.id },
                    data: {
                        accumulatedDepreciation: Number(asset.accumulatedDepreciation) + depreciationAmount,
                        netBookValue: Number(asset.netBookValue) - depreciationAmount
                    }
                });

                // Record Transaction
                await prisma.assetTransaction.create({
                    data: {
                        assetId: asset.id,
                        transactionType: 'DEPRECIATION',
                        transactionDate: fiscalPeriodDate,
                        amount: depreciationAmount
                    }
                });

                // Generate JE: 
                // DR Depreciation Expense
                // CR Accumulated Depreciation

                depreciatedCount++;
            }
        }

        return depreciatedCount;
    }

    /**
     * Process an asset disposal (Sale or Scrap)
     */
    static async disposeAsset(assetId: number, disposalDate: Date, saleProceeds: number = 0) {
        const asset = await prisma.fixedAssetAdvanced.findUnique({ where: { id: assetId } });
        if (!asset || asset.status !== 'ACTIVE') throw new Error("Asset not active");

        const nbv = Number(asset.netBookValue);
        const gainOrLoss = saleProceeds - nbv;

        await prisma.fixedAssetAdvanced.update({
            where: { id: assetId },
            data: { status: 'DISPOSED' }
        });

        await prisma.assetTransaction.create({
            data: {
                assetId: asset.id,
                transactionType: 'DISPOSAL',
                transactionDate: disposalDate,
                amount: saleProceeds,
                notes: `Proceeds: ${saleProceeds}, NBV: ${nbv}, Gain/Loss: ${gainOrLoss}`
            }
        });

        // Accounting entry:
        // DR Cash/AR (Proceeds)
        // DR Accumulated Depreciation (Total)
        // DR Loss on Disposal (if gainOrLoss < 0)
        // CR Fixed Asset Cost
        // CR Gain on Disposal (if gainOrLoss > 0)

        return { gainOrLoss, netBookValue: nbv };
    }
}
