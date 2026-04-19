import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();
        const data: any = {};
        
        if (body.productionDate !== undefined) data.productionDate = body.productionDate ? new Date(body.productionDate) : null;
        if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
        if (body.unitCost !== undefined) data.unitCost = parseFloat(body.unitCost);

        const batch = await prisma.productBatch.update({
            where: { id: parseInt(id) },
            data
        });
        return NextResponse.json(batch);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches/[id]' });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const batchId = parseInt(id);
        
        const batch = await prisma.productBatch.findUnique({ where: { id: batchId } });
        if (batch && batch.initialQuantity !== batch.currentQuantity) {
            return NextResponse.json({ error: 'لا يمكن حذف تشغيلة حدث عليها سحب مبيعات أو تحويلات' }, { status: 400 });
        }

        // Must reverse the stock and delete movement if we delete it
        if (batch) {
            await prisma.$transaction(async (tx) => {
                await tx.product.update({
                    where: { id: batch.productId },
                    data: { currentStock: { decrement: batch.currentQuantity } }
                });
                await tx.stockMovement.deleteMany({ where: { referenceType: 'batch_entry', referenceId: batchId } });
                await tx.productBatch.delete({ where: { id: batchId } });
            });
        } else {
            await prisma.productBatch.delete({ where: { id: batchId } });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches/[id]' });
    }
}
