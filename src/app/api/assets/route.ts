import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const assets = await prisma.fixedAsset.findMany({
            include: { depreciations: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(assets, { status: 200 });
    } catch (error: any) {
        return apiError(error, 'فشل جلب الأصول', { context: 'assets' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const purchaseCost = parseFloat(body.purchaseCost);
        
        const newAsset = await prisma.fixedAsset.create({
            data: {
                assetName: body.assetName,
                assetType: body.assetType || 'معدات', // معدات، سيارات، مباني
                purchaseDate: new Date(body.purchaseDate),
                purchaseCost: purchaseCost,
                salvageValue: parseFloat(body.salvageValue) || 0,
                usefulLifeYears: parseInt(body.usefulLifeYears) || 5,
                currentValue: purchaseCost, // initially equals cost
                location: body.location || '',
                status: 'active'
            }
        });

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error: any) {
        return apiError(error, 'Error registering Fixed Asset', { context: 'assets' });
    }
}
