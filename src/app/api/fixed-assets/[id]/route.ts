import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data: any = {};
        if (body.assetName) data.assetName = body.assetName;
        if (body.assetType) data.assetType = body.assetType;
        if (body.location !== undefined) data.location = body.location || null;
        if (body.status) data.status = body.status;
        if (body.salvageValue !== undefined) data.salvageValue = parseFloat(body.salvageValue);
        if (body.usefulLifeYears) data.usefulLifeYears = parseInt(body.usefulLifeYears);

        const asset = await prisma.fixedAsset.update({ where: { id: parseInt(id) }, data });
        return NextResponse.json(asset);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets/[id]' });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const assetId = parseInt(id);
        await prisma.depreciation.deleteMany({ where: { assetId } });
        await prisma.fixedAsset.delete({ where: { id: assetId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets/[id]' });
    }
}
