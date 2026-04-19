import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const assets = await prisma.fixedAsset.findMany({
            orderBy: { id: 'desc' },
            include: { depreciations: true }
        });

        return NextResponse.json(assets);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { assetName, assetType, purchaseDate, purchaseCost, salvageValue, usefulLifeYears, location } = body;

        const asset = await prisma.fixedAsset.create({
            data: {
                assetName,
                assetType,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                purchaseCost: parseFloat(purchaseCost) || 0,
                salvageValue: parseFloat(salvageValue) || 0,
                usefulLifeYears: parseInt(usefulLifeYears) || 1,
                currentValue: parseFloat(purchaseCost) || 0,
                location: location || 'المركز الرئيسي'
            }
        });

        // Add initial journal entry via trigger or manual later.
        return NextResponse.json(asset);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 400 });
    }
}
