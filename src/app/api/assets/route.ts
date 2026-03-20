import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const assets = await prisma.fixedAsset.findMany({
            include: { depreciations: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(assets, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'فشل جلب الأصول' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
        return NextResponse.json({ error: error.message || 'Error registering Fixed Asset' }, { status: 500 });
    }
}
