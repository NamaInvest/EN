import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const batches = await prisma.productBatch.findMany({
            take: 100,
            include: { product: { select: { name: true, barcode: true } } },
            orderBy: { expiryDate: 'asc' }
        });
        return NextResponse.json(batches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        
        if (!body.productId || !body.batchNumber || !body.initialQuantity) {
            return NextResponse.json({ error: 'رقم التشغيلة، المنتج، والكمية مطلوبة' }, { status: 400 });
        }

        const batch = await prisma.productBatch.create({
            data: {
                productId: parseInt(body.productId),
                batchNumber: body.batchNumber,
                productionDate: body.productionDate ? new Date(body.productionDate) : null,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
                initialQuantity: parseFloat(body.initialQuantity),
                currentQuantity: parseFloat(body.initialQuantity),
                unitCost: parseFloat(body.unitCost || '0')
            }
        });
        
        // Also add a stock movement to track the entry
        await prisma.stockMovement.create({
            data: {
                productId: parseInt(body.productId),
                stockId: 1, // Default stock for now
                type: 'in',
                quantity: parseFloat(body.initialQuantity),
                referenceType: 'batch_entry',
                referenceId: batch.id,
                batchId: batch.id,
                notes: `إدخال رصيد عن طريق إنشاء تشغيلة جديدة (${body.batchNumber})`,
                userId: body.userId ? parseInt(body.userId) : null
            }
        });

        // Update main product stock
        await prisma.product.update({
            where: { id: parseInt(body.productId) },
            data: { currentStock: { increment: parseFloat(body.initialQuantity) } }
        });

        return NextResponse.json(batch, { status: 201 });
    } catch (error: any) {
        console.error('Error creating batch:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches' });
    }
}
