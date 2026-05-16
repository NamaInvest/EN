import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'batches.id' });

const _PUTSchema = z.object({
  productionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  unitCost: z.number().optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);
    try {
        const { id } = await params;
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const data: any = {};
        
        if (body.productionDate !== undefined) data.productionDate = body.productionDate ? new Date(body.productionDate) : null;
        if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
        if (body.unitCost !== undefined) data.unitCost = parseFloat(body.unitCost);

        const batch = await prisma.productBatch.update({
            where: { id: parseInt(id), ...requireTenantFilter({ tenantId }) },
            data
        });
        return NextResponse.json(batch);
    } catch (error: any) {
        log.error('batches.id.PUT', { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches/[id]' });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }, auth: any) {
    // Auth guard
    const tenantId = assertTenant(auth?.tenantId);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const batchId = parseInt(id);
        
        const batch = await prisma.productBatch.findUnique({ 
            where: { id: batchId, ...requireTenantFilter({ tenantId }) } 
        });
        if (batch && batch.initialQuantity !== batch.currentQuantity) {
            return NextResponse.json({ error: 'لا يمكن حذف تشغيلة حدث عليها سحب مبيعات أو تحويلات' }, { status: 400 });
        }

        // Must reverse the stock and delete movement if we delete it
        if (batch) {
            await runInventoryTx(prisma, async (tx) => {
                await tx.product.update({
                    where: { id: batch.productId, ...requireTenantFilter({ tenantId }) },
                    data: { currentStock: { decrement: batch.currentQuantity } }
                });
                await tx.stockMovement.deleteMany({ 
                    where: { referenceType: 'batch_entry', referenceId: batchId, ...requireTenantFilter({ tenantId }) } 
                });
                await tx.productBatch.delete({ 
                    where: { id: batchId, ...requireTenantFilter({ tenantId }) } 
                });
            }, 'BATCH_DELETE');
        } else {
            await prisma.productBatch.delete({ 
                where: { id: batchId, ...requireTenantFilter({ tenantId }) } 
            });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        log.error('batches.id.DELETE', { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'batches/[id]' });
    }
}

export const PUT = withRoute(async ({ req, auth }, context) => _PUT(req as any, context, auth), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req, auth }, context) => _DELETE(req as any, context, auth), { rateLimit: 'DEFAULT' });

