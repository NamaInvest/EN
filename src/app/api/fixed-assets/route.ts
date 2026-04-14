import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET() {
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
