import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';

export async function GET() {
    const prisma = getPrisma(request);
    try {
        const assets = await prisma.fixedAsset.findMany({
            include: { depreciations: { orderBy: { depreciationDate: 'desc' } } },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(assets);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        if (!body.assetName || !body.assetType || !body.purchaseCost) {
            return NextResponse.json({ error: 'اسم الأصل والنوع وتكلفة الشراء مطلوبة' }, { status: 400 });
        }
        const purchaseCost = parseFloat(body.purchaseCost);
        const asset = await prisma.fixedAsset.create({
            data: {
                assetName: body.assetName,
                assetType: body.assetType,
                purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
                purchaseCost,
                salvageValue: parseFloat(body.salvageValue || '0'),
                usefulLifeYears: parseInt(body.usefulLifeYears || '5'),
                currentValue: purchaseCost,
                location: body.location || null,
                status: 'active'
            }
        });
        return NextResponse.json(asset, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets' });
    }
}
