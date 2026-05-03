import { prisma } from './prisma';

export class FixedAssetsEngine {
    
    private static async _getAccountId(codeOrKey: string, fallbackId: number): Promise<number> {
        const setting = await prisma.setting.findUnique({ where: { key: codeOrKey } });
        const codeToSearch = setting?.value || codeOrKey;
        const acc = await prisma.account.findFirst({ where: { code: codeToSearch } });
        return acc ? acc.id : fallbackId;
    }
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
        const assetAccountId = await FixedAssetsEngine._getAccountId('acc_fixed_asset', 1200);
        const cwipAccountId = await FixedAssetsEngine._getAccountId('acc_cwip', 1290);
        
        await prisma.journalEntry.create({
            data: {
                entryNumber: `CAP-${assetId}-${Date.now()}`,
                entryDate: placedInServiceDate.toISOString(),
                description: `Capitalization of Asset #${assetId}`,
                status: 'posted',
                totalDebit: Number(asset.purchaseCost),
                totalCredit: Number(asset.purchaseCost),
                createdBy: 1,
                lines: {
                    create: [
                        { accountId: assetAccountId, debit: Number(asset.purchaseCost), credit: 0, description: 'Fixed Asset' },
                        { accountId: cwipAccountId, debit: 0, credit: Number(asset.purchaseCost), description: 'CWIP Offset' }
                    ]
                }
            }
        });

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
                const depExpenseAccountId = await FixedAssetsEngine._getAccountId('acc_dep_expense', 5100);
                const accDepAccountId = await FixedAssetsEngine._getAccountId('acc_accumulated_dep', 1250);

                await prisma.journalEntry.create({
                    data: {
                        entryNumber: `DEP-${asset.id}-${fiscalPeriodDate.getTime()}`,
                        entryDate: fiscalPeriodDate.toISOString(),
                        description: `Depreciation for Asset #${asset.id}`,
                        status: 'posted',
                        totalDebit: depreciationAmount,
                        totalCredit: depreciationAmount,
                        createdBy: 1,
                        lines: {
                            create: [
                                { accountId: depExpenseAccountId, debit: depreciationAmount, credit: 0, description: 'Depreciation Expense' },
                                { accountId: accDepAccountId, debit: 0, credit: depreciationAmount, description: 'Accumulated Depreciation' }
                            ]
                        }
                    }
                });

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
        const cashAccountId = await FixedAssetsEngine._getAccountId('acc_cash', 1010);
        const accDepAccountId = await FixedAssetsEngine._getAccountId('acc_accumulated_dep', 1250);
        const assetAccountId = await FixedAssetsEngine._getAccountId('acc_fixed_asset', 1200);
        const lossAccountId = await FixedAssetsEngine._getAccountId('acc_loss_disposal', 5200);
        const gainAccountId = await FixedAssetsEngine._getAccountId('acc_gain_disposal', 4200);

        const totalDebit = saleProceeds + Number(asset.accumulatedDepreciation) + (gainOrLoss < 0 ? Math.abs(gainOrLoss) : 0);

        const lines = [
            { accountId: cashAccountId, debit: saleProceeds, credit: 0, description: 'Proceeds' },
            { accountId: accDepAccountId, debit: Number(asset.accumulatedDepreciation), credit: 0, description: 'Acc. Depr' },
            { accountId: assetAccountId, debit: 0, credit: Number(asset.purchaseCost), description: 'Asset Cost' }
        ];

        if (gainOrLoss < 0) {
            lines.push({ accountId: lossAccountId, debit: Math.abs(gainOrLoss), credit: 0, description: 'Loss on Disposal' });
        } else if (gainOrLoss > 0) {
            lines.push({ accountId: gainAccountId, debit: 0, credit: gainOrLoss, description: 'Gain on Disposal' });
        }

        await prisma.journalEntry.create({
            data: {
                entryNumber: `DISP-${asset.id}-${Date.now()}`,
                entryDate: disposalDate.toISOString(),
                description: `Disposal of Asset #${asset.id}`,
                status: 'posted',
                totalDebit: totalDebit,
                totalCredit: totalDebit,
                createdBy: 1,
                lines: { create: lines }
            }
        });

        return { gainOrLoss, netBookValue: nbv };
    }
}
