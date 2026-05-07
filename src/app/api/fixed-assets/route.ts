import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const assets = await prisma.fixedAsset.findMany({
            take: 100,
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(assets);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
        const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const name = body.assetName || body.name;
        const acquisitionCost = parseFloat(body.purchaseCost ?? body.acquisitionCost ?? '0');
        if (!name || !acquisitionCost) {
            return NextResponse.json({ error: 'اسم الأصل وتكلفة الاقتناء مطلوبة' }, { status: 400 });
        }

        // Generate asset number
        const { getNextNumber } = require('@/lib/numbering');
        const seqResult = await getNextNumber(prisma, 'FA', undefined);

        const acquisitionDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();

        const asset = await prisma.fixedAsset.create({
            data: {
                assetNumber: seqResult.formatted,
                name,
                acquisitionDate,
                acquisitionCost,
                salvageValue: parseFloat(body.salvageValue || '0'),
                usefulLifeYears: parseInt(body.usefulLifeYears || '5'),
                currentBookValue: acquisitionCost,
                depreciationMethod: body.depreciationMethod || 'STRAIGHT_LINE',
                depreciationStartDate: body.depreciationStartDate ? new Date(body.depreciationStartDate) : acquisitionDate,
                locationId: body.locationId || null,
                status: 'ACTIVE',
            },
        });
        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets' });
    }
}
