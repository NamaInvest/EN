import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
    try {
        const assets = await prisma.fixedAsset.findMany({
            where: { status: 'active', currentValue: { gt: 0 } }
        });

        let depreciatedCount = 0;
        let totalMonthlyDepreciation = 0;

        await prisma.$transaction(async (tx) => {
            for (const asset of assets) {
                // Pre-check if asset has already hit its salvage value floor
                if (asset.currentValue <= asset.salvageValue) {
                    await tx.fixedAsset.update({ where: { id: asset.id }, data: { status: 'fully_depreciated' } });
                    continue;
                }

                // Straight-Line Monthly Depreciation logic: (Cost - Salvage) / (Years * 12)
                const yearlyDepreciation = (asset.purchaseCost - asset.salvageValue) / (asset.usefulLifeYears > 0 ? asset.usefulLifeYears : 1);
                const monthlyDepreciation = yearlyDepreciation / 12;

                // Adjust to ensure we don't drop below salvage value
                let actualDepreciation = monthlyDepreciation;
                if (asset.currentValue - monthlyDepreciation < asset.salvageValue) {
                    actualDepreciation = asset.currentValue - asset.salvageValue;
                }

                if (actualDepreciation <= 0) continue;

                // 1. Create the Depreciation Log
                await tx.depreciation.create({
                    data: {
                        assetId: asset.id,
                        depreciationDate: new Date(),
                        amount: actualDepreciation,
                    }
                });

                // 2. Reduce the Book Value of the Asset
                await tx.fixedAsset.update({
                    where: { id: asset.id },
                    data: { currentValue: { decrement: actualDepreciation } }
                });

                totalMonthlyDepreciation += actualDepreciation;
                depreciatedCount++;
            }

            // 3. Optional: Create a Macro Journal Entry for Total Depreciation Expense
            if (totalMonthlyDepreciation > 0) {
                // Generating a descriptive reference
                const refCode = `DEP-${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
                
                // Note: Normally we'd bind to explicit Account IDs (Debit 5XX, Credit 1XX-Accumulated).
                // Assuming robust account lookup or manual reconciliation later, we log a standalone "Memorandum" journal if no explicit map.
                await tx.journalEntry.create({
                    data: {
                        entryNumber: refCode,
                        entryDate: new Date().toISOString().split('T')[0],
                        description: `إهلاك الأصول الثابتة الإجمالي لشهر ${new Date().getMonth() + 1}`,
                        reference: 'AUTO_DEPRECIATION',
                        totalDebit: totalMonthlyDepreciation,
                        totalCredit: totalMonthlyDepreciation,
                        status: 'posted'
                    }
                });
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `تم حساب وتطبيق الإهلاك بنجاح على ${depreciatedCount} أصل مالي بقيمة ${totalMonthlyDepreciation.toFixed(2)} ر.س.` 
        }, { status: 200 });
        
    } catch (error: any) {
        console.error("Depreciation Error:", error);
        return apiError(error, 'فشل إجراء دورة الإهلاك الشهرية.', { context: 'assets/depreciate' });
    }
}
