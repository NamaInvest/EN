import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const assetId = parseInt(id);
        const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } });
        if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
        if (asset.status !== 'active') return NextResponse.json({ error: 'لا يمكن إهلاك أصل غير نشط' }, { status: 400 });

        // Calculate annual depreciation: (cost - salvage) / useful life
        const annualDepreciation = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
        const newValue = Math.max(asset.salvageValue, asset.currentValue - annualDepreciation);

        const result = await prisma.$transaction([
            prisma.depreciation.create({
                data: {
                    assetId,
                    depreciationDate: new Date(),
                    amount: asset.currentValue - newValue,
                }
            }),
            prisma.fixedAsset.update({
                where: { id: assetId },
                data: {
                    currentValue: newValue,
                    status: newValue <= asset.salvageValue ? 'fully_depreciated' : 'active'
                }
            })
        ]);

        return NextResponse.json({ depreciation: result[0], asset: result[1] });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
