import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const assetId = parseInt(params.id, 10);
        const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } });
        
        if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
        if (asset.status !== 'active') return NextResponse.json({ error: 'الأصل غير نشط أو تم التخلص منه' }, { status: 400 });
        if (asset.currentValue <= asset.salvageValue) return NextResponse.json({ error: 'تم إهلاك الأصل بالكامل' }, { status: 400 });

        // Calculate Straight-Line Depreciation (Monthly)
        const depreciableBase = asset.purchaseCost - asset.salvageValue;
        const annualDepreciation = depreciableBase / asset.usefulLifeYears;
        let depreciationAmount = annualDepreciation / 12;

        if (asset.currentValue - depreciationAmount < asset.salvageValue) {
            depreciationAmount = asset.currentValue - asset.salvageValue;
        }

        if (depreciationAmount <= 0) return NextResponse.json({ error: 'لا يوجد مبلغ للإهلاك' }, { status: 400 });

        const newValue = asset.currentValue - depreciationAmount;
        const newStatus = newValue <= asset.salvageValue ? 'fully_depreciated' : 'active';

        // Get Accounts
        const getAccountId = async (key: string, fallback: number) => {
            const setting = await prisma.setting.findUnique({ where: { key } });
            const code = setting?.value || key;
            const acc = await prisma.account.findFirst({ where: { code } });
            return acc ? acc.id : fallback;
        };

        const depExpenseAccountId = await getAccountId('acc_dep_expense', 5100);
        const accDepAccountId = await getAccountId('acc_accumulated_dep', 1250);

        await prisma.$transaction(async (tx: any) => {
            // Update Asset
            await tx.fixedAsset.update({
                where: { id: assetId },
                data: { currentValue: newValue, status: newStatus }
            });

            // Create Journal Entry
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `DEP-${asset.id}-${Date.now()}`,
                    entryDate: new Date().toISOString(),
                    description: `إهلاك الأصل: ${asset.assetName}`,
                    status: 'posted',
                    totalDebit: depreciationAmount,
                    totalCredit: depreciationAmount,
                    createdBy: _auth.id,
                    lines: {
                        create: [
                            { accountId: depExpenseAccountId, debit: depreciationAmount, credit: 0, description: 'مصروف الإهلاك' },
                            { accountId: accDepAccountId, debit: 0, credit: depreciationAmount, description: 'مجمع الإهلاك' }
                        ]
                    }
                }
            });

            // Create Depreciation Record
            await tx.depreciation.create({
                data: {
                    assetId,
                    depreciationDate: new Date(),
                    amount: depreciationAmount,
                    journalEntryId: je.id
                }
            });
        });

        return NextResponse.json({ success: true, message: 'تم إهلاك الأصل وتسجيل القيد بنجاح' }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets-depreciate' });
    }
}
