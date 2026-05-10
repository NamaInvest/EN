import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'batches' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const batches = await prisma.productBatch.findMany({
            take: 100,
            include: { product: { select: { name: true, barcode: true } } },
            orderBy: { expiryDate: 'asc' }
        });
        return NextResponse.json(batches);
    } catch (error: any) {
        log.error('Error fetching batches:', error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  batchNumber: z.any().optional(),
  initialQuantity: z.number().optional(),
  productionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  unitCost: z.number().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
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
        log.error('Error creating batch:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
