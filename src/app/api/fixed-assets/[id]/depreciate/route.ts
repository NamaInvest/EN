import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { n } from '@/lib/decimal-utils';

const log = logger.child({ service: 'fixed-assets.id.depreciate' });

async function _POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }, auth: any) {
    const { id } = await params;
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = assertTenant(auth?.tenantId);

    const prisma = getPrisma(request);
    try {
        const assetId = parseInt(id, 10);
        // Use findFirst to enforce tenantId
        const asset = await prisma.fixedAsset.findFirst({ 
            where: { id: assetId, ...requireTenantFilter({ tenantId }) } 
        });

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

        // Resolve account IDs from settings
        const getAccountId = async (key: string, fallback: number) => {
            const setting = await prisma.setting.findFirst({ where: { key, ...requireTenantFilter({ tenantId }) } });
            const code = setting?.value || key;
            const acc = await prisma.account.findFirst({ where: { code, ...requireTenantFilter({ tenantId }) } });
            return acc ? acc.id : fallback;
        };
        const depExpenseAccountId = await getAccountId('acc_dep_expense', 5100);
        const accDepAccountId = await getAccountId('acc_accumulated_dep', 1250);

        const now = new Date();

        await runFinancialTx(prisma, async (tx: any) => {
            await tx.fixedAsset.update({
                where: { id: assetId },
                data: {
                    accumulatedDepreciation: newAccumulated,
                    currentBookValue: newBookValue,
                },
            });

            // Get next document number within transaction
            const { getNextNumber } = await import('@/lib/numbering');
            const seqResult = await getNextNumber(tx, 'JE', undefined);

            const je = await tx.journalEntry.create({
                data: {
                    tenantId,
                    entryNumber: seqResult.formatted,
                    entryDate: now.toISOString(),
                    description: `إهلاك الأصل: ${asset.name}`,
                    status: 'posted',
                    totalDebit: depreciationAmount,
                    totalCredit: depreciationAmount,
                    createdBy: auth.userId || null,
                    lines: {
                        create: [
                            { tenantId, accountId: depExpenseAccountId, debit: depreciationAmount, credit: 0, description: 'مصروف الإهلاك' },
                            { tenantId, accountId: accDepAccountId, debit: 0, credit: depreciationAmount, description: 'مجمع الإهلاك' },
                        ],
                    },
                },
            });

            await tx.assetDepreciationLog.create({
                data: {
                    tenantId,
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
        }, 'FIXED_ASSET_DEPRECIATION');

        return NextResponse.json({ success: true, message: 'تم إهلاك الأصل وتسجيل القيد بنجاح' });
    } catch (error: any) {
        log.error('fixed-assets/depreciate', { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets-depreciate' });
    }
}

export const POST = withRoute(async ({ req, auth }, context) => _POST(req as any, context, auth), { rateLimit: 'FINANCIAL' });

