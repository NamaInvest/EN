import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const assetId = parseInt(id, 10);
        const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } });

        if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
        if (asset.status !== 'ACTIVE') return NextResponse.json({ error: 'الأصل غير نشط أو تم التخلص منه' }, { status: 400 });

        const currentBookValue = Number(asset.currentBookValue);
        const salvageValue = Number(asset.salvageValue);
        const acquisitionCost = Number(asset.acquisitionCost);

        if (currentBookValue <= salvageValue) {
            return NextResponse.json({ error: 'تم إهلاك الأصل بالكامل' }, { status: 400 });
        }

        // Calculate Straight-Line Depreciation (Monthly)
        const usefulLife = asset.usefulLifeYears || 1;
        const depreciableBase = acquisitionCost - salvageValue;
        const annualDepreciation = depreciableBase / usefulLife;
        let depreciationAmount = annualDepreciation / 12;

        if (currentBookValue - depreciationAmount < salvageValue) {
            depreciationAmount = currentBookValue - salvageValue;
        }
        if (depreciationAmount <= 0) {
            return NextResponse.json({ error: 'لا يوجد مبلغ للإهلاك' }, { status: 400 });
        }

        const newBookValue = currentBookValue - depreciationAmount;
        const newAccumulated = Number(asset.accumulatedDepreciation) + depreciationAmount;

        // Resolve account IDs from settings (with fallbacks)
        const getAccountId = async (key: string, fallback: number) => {
            const setting = await prisma.setting.findUnique({ where: { key } });
            const code = setting?.value || key;
            const acc = await prisma.account.findFirst({ where: { code } });
            return acc ? acc.id : fallback;
        };
        const depExpenseAccountId = await getAccountId('acc_dep_expense', 5100);
        const accDepAccountId = await getAccountId('acc_accumulated_dep', 1250);

        const now = new Date();

        await prisma.$transaction(async (tx: any) => {
            await tx.fixedAsset.update({
                where: { id: assetId },
                data: {
                    accumulatedDepreciation: newAccumulated,
                    currentBookValue: newBookValue,
                },
            });

            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `DEP-${asset.id}-${Date.now()}`,
                    entryDate: now.toISOString(),
                    description: `إهلاك الأصل: ${asset.name}`,
                    status: 'posted',
                    totalDebit: depreciationAmount,
                    totalCredit: depreciationAmount,
                    createdBy: _auth.id,
                    lines: {
                        create: [
                            { accountId: depExpenseAccountId, debit: depreciationAmount, credit: 0, description: 'مصروف الإهلاك' },
                            { accountId: accDepAccountId, debit: 0, credit: depreciationAmount, description: 'مجمع الإهلاك' },
                        ],
                    },
                },
            });

            await tx.assetDepreciationLog.create({
                data: {
                    assetId,
                    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
                    periodEnd: now,
                    openingNbv: currentBookValue,
                    depreciationAmount,
                    closingNbv: newBookValue,
                    method: asset.depreciationMethod || 'STRAIGHT_LINE',
                    journalEntryId: je.id,
                },
            });
        });

        return NextResponse.json({ success: true, message: 'تم إهلاك الأصل وتسجيل القيد بنجاح' });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets-depreciate' });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
