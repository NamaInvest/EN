import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { runMRP } from '@/lib/mrp-engine';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { InventoryService } from '@/lib/services/inventory.service';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'manufacturing.orders' });

async function _GET(request: NextRequest, auth: any) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);

    try {
        const orders = await prisma.manufacturingOrder.findMany({ 
            take: 100,
            where: requireTenantFilter({ tenantId }),
            include: {
                recipe: { include: { finishedProduct: true, ingredients: { include: { rawProduct: true } } } },
                machine: true,
                wastages: true
            },
            orderBy: { id: 'desc' }
        });

        const recipes = await prisma.recipe.findMany({ 
            take: 100, 
            where: { isActive: true, ...requireTenantFilter({ tenantId }) }, 
            include: { finishedProduct: true } 
        });
        const machines = await prisma.machine.findMany({ 
            take: 100, 
            where: { status: 'active', ...requireTenantFilter({ tenantId }) } 
        });

        return NextResponse.json({ orders, recipes, machines }, { status: 200 });
    } catch (error: any) {
        log.error('manufacturing.orders.GET', { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'فشل جلب أوامر التصنيع', { context: 'manufacturing/orders' });
    }
}

const _POSTSchema = z.object({
  recipeId: z.union([z.string(), z.number()]).optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
  quantityToProduce: z.number().optional(),
  quantity: z.number().optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest, auth: any) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);

    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const lastOrder = await prisma.manufacturingOrder.findFirst({ 
            where: requireTenantFilter({ tenantId }),
            orderBy: { id: 'desc' } 
        });
        const nextId = (lastOrder?.id || 0) + 1;
        const orderNumber = `MFG-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

        const newOrder = await prisma.manufacturingOrder.create({
            data: {
                tenantId,
                orderNumber,
                recipeId: parseInt(body.recipeId),
                machineId: body.machineId ? parseInt(body.machineId) : null,
                quantityToProduce: parseFloat(body.quantityToProduce || body.quantity),
                status: 'draft',
                stockId: body.stockId ? parseInt(body.stockId) : 1,
                userId: auth?.userId || null,
                notes: body.notes || ''
            },
            include: { recipe: true, machine: true }
        });

        const { logAuditEvent } = await import('@/lib/audit-trail');
        await logAuditEvent(prisma as any, {
            tenantId,
            userId: auth?.userId || null,
            action: 'CREATE',
            entityType: 'ManufacturingOrder',
            entityId: newOrder.id,
            route: '/api/manufacturing/orders',
            newData: { orderNumber: newOrder.orderNumber, status: newOrder.status },
            ipAddress: request.headers.get('x-forwarded-for') || null,
        });

        // تشغيل MRP — فحص توفر المواد الخام وتوليد طلب شراء تلقائي عند النقص
        let mrpResult = null;
        try {
            mrpResult = await runMRP(newOrder.id);
        } catch (mrpErr: unknown) {
            log.warn('MRP check failed (non-blocking):', mrpErr);
        }

        return NextResponse.json({ ...newOrder, mrp: mrpResult }, { status: 201 });
    } catch (error: any) {
        log.error('manufacturing.orders.POST', { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'Error creating Manufacturing Order', { context: 'manufacturing/orders' });
    }
}

const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  wastageData: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest, auth: any) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);

    try {
        const body = await request.json();
        const { id, status, wastageData } = body;

        const currentOrder = await prisma.manufacturingOrder.findFirst({
            where: { id: parseInt(id), ...requireTenantFilter({ tenantId }) },
            include: { recipe: { include: { ingredients: true } } }
        });

        if (!currentOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // If shifting to completed, we must perform Heavy Manufacturing Stock Adjustments
        if (status === 'completed' && currentOrder.status !== 'completed') {
            await runFinancialTx(prisma, async (tx) => {
                let totalMaterialCost = 0;

                // 1. Deduct Raw Materials based on exact BOM (Bill of Materials) formula
                for (const ing of currentOrder.recipe.ingredients) {
                    const requiredQty = n(ing.quantity) * n(currentOrder.quantityToProduce);
                    
                    const rawProd = await tx.product.findFirst({
                        where: { id: ing.rawProductId, ...requireTenantFilter({ tenantId }) }
                    });

                    if (!rawProd) throw new Error(`Raw product ${ing.rawProductId} not found`);

                    await InventoryService.adjustStock(tx, {
                        tenantId,
                        productId: ing.rawProductId,
                        stockId: currentOrder.stockId,
                        quantityChange: -requiredQty,
                        reason: `Manufacturing consumption for MO-${currentOrder.orderNumber}`,
                        sourceType: 'MANUFACTURING_CONSUMPTION'
                    });

                    await InventoryService.recordMovement(tx, {
                        tenantId,
                        productId: ing.rawProductId,
                        stockId: currentOrder.stockId,
                        quantity: -requiredQty,
                        type: 'OUT',
                        referenceId: currentOrder.id,
                        referenceType: 'MANUFACTURING_ORDER',
                        notes: `Material consumption`
                    });

                    // We approximate the production cost of the finished good natively from the raw materials' average buy price
                    totalMaterialCost += (n(rawProd.buyPrice) || 0) * requiredQty;
                }

                // 2. Handle specific Scrap/Wastage reported by the factory floor
                if (wastageData && wastageData.length > 0) {
                    for (const waste of wastageData) {
                        const lostQty = parseFloat(waste.lostQuantity);
                        
                        const rawProd = await tx.product.findFirst({
                            where: { id: waste.rawProductId, ...requireTenantFilter({ tenantId }) }
                        });
                        
                        if (!rawProd) throw new Error(`Wastage raw product ${waste.rawProductId} not found`);

                        await InventoryService.adjustStock(tx, {
                            tenantId,
                            productId: waste.rawProductId,
                            stockId: currentOrder.stockId,
                            quantityChange: -lostQty,
                            reason: `Wastage reported for MO-${currentOrder.orderNumber}`,
                            sourceType: 'MANUFACTURING_SCRAP'
                        });

                        await InventoryService.recordMovement(tx, {
                            tenantId,
                            productId: waste.rawProductId,
                            stockId: currentOrder.stockId,
                            quantity: -lostQty,
                            type: 'OUT',
                            referenceId: currentOrder.id,
                            referenceType: 'MANUFACTURING_WASTAGE',
                            notes: waste.reason || `Material wastage`
                        });

                        const lostCost = (n(rawProd.buyPrice) || 0) * lostQty;
                        totalMaterialCost += lostCost; // Wastage natively transfers into the cost of the surviving goods

                        await tx.manufacturingWastage.create({
                            data: {
                                tenantId,
                                manufacturingOrderId: currentOrder.id,
                                rawProductId: waste.rawProductId,
                                lostQuantity: lostQty,
                                wastedCost: lostCost,
                                reason: waste.reason || 'توالف أثناء التصنيع'
                            }
                        });
                    }
                }

                // 3. Optional Machine Hourly Cost (Factory Overhead)
                let overheadCost = 0;
                if (currentOrder.machineId) {
                    const machine = await tx.machine.findFirst({ 
                        where: { id: currentOrder.machineId, ...requireTenantFilter({ tenantId }) } 
                    });
                    if (machine && n(machine.hourlyCost) > 0) {
                        const hoursElapsed = Math.abs(new Date().getTime() - currentOrder.startDate.getTime()) / 3600000;
                        overheadCost = hoursElapsed * n(machine.hourlyCost);
                        totalMaterialCost += overheadCost;
                    }
                }

                // 4. Finalize the Finished Good by INCREMENTING its stock
                const singleUnitCost = totalMaterialCost / n(currentOrder.quantityToProduce);
                
                await tx.product.updateMany({
                    where: { id: currentOrder.recipe.finishedProductId , tenantId },
                    data: {
                        buyPrice: singleUnitCost // Recalibrates average valuation automatically
                    }
                });

                await InventoryService.adjustStock(tx, {
                    tenantId,
                    productId: currentOrder.recipe.finishedProductId,
                    stockId: currentOrder.stockId,
                    quantityChange: currentOrder.quantityToProduce,
                    reason: `Manufacturing completion for MO-${currentOrder.orderNumber}`,
                    sourceType: 'MANUFACTURING_PRODUCTION'
                });

                await InventoryService.recordMovement(tx, {
                    tenantId,
                    productId: currentOrder.recipe.finishedProductId,
                    stockId: currentOrder.stockId,
                    quantity: currentOrder.quantityToProduce,
                    type: 'IN',
                    referenceId: currentOrder.id,
                    referenceType: 'MANUFACTURING_ORDER',
                    notes: `Finished goods receipt`
                });

                // Update the original order state natively
                const updatedMfgOrder = await tx.manufacturingOrder.updateMany({
                    where: { id: currentOrder.id , tenantId },
                    data: {
                        status: 'completed',
                        endDate: new Date(),
                        totalCost: totalMaterialCost
                    }
                });

                const { logAuditEvent } = await import('@/lib/audit-trail');
                await logAuditEvent(tx as any, {
                    tenantId,
                    userId: auth?.userId || null,
                    action: 'UPDATE',
                    entityType: 'ManufacturingOrder',
                    entityId: currentOrder.id,
                    route: '/api/manufacturing/orders',
                    oldData: { status: currentOrder.status },
                    newData: { status: 'completed', totalCost: totalMaterialCost },
                    ipAddress: request.headers.get('x-forwarded-for') || null,
                });

                // Auto-Journal: WIP -> Finished Goods natively inside transaction
                const { ACCOUNTS } = await import('@/lib/auto-journal');
                const { AccountingJournalService } = await import('@/lib/services/accounting-journal.service');
                
                await AccountingJournalService.createEntry(tx, {
                    description: `إقفال أمر التصنيع ${currentOrder.orderNumber} وتحويل التكلفة للمنتج التام`,
                    reference: currentOrder.orderNumber,
                    lines: [
                        { accountCode: ACCOUNTS.FINISHED_GOODS || '1340', debit: totalMaterialCost, credit: 0, description: 'إثبات المنتج التام' },
                        { accountCode: ACCOUNTS.WIP || '1330', debit: 0, credit: totalMaterialCost, description: 'تخفيض حساب تحت التشغيل' }
                    ],
                    status: 'posted'
                });

            }, 'MANUFACTURING_ORDER_COMPLETION');

            return NextResponse.json({ success: true, message: 'Manufacturing Order Completed successfully with stock mutations' });
        } else {
            // Simple status tracking transition (e.g. Draft -> Processing -> Quality)
            const updated = await prisma.manufacturingOrder.updateMany({
                where: { id: parseInt(id) , tenantId }, // No need to check tenant again if currentOrder matched
                data: { status }
            });
            return NextResponse.json(updated);
        }
    } catch (error: any) {
        log.error("Manufacturing Validation Error:", { error: error instanceof Error ? error.message : error, tenantId });
        return apiError(error, 'Error altering order matrix', { context: 'manufacturing/orders' });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = assertTenant(auth?.tenantId);
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'mfg_ord_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any, auth);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'mfg_ord_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'mfg_ord_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'mfg_ord_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req, auth }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = assertTenant(auth?.tenantId);
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'mfg_ord_put', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _PUT(req as any, auth);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'mfg_ord_put', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'mfg_ord_put', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'mfg_ord_put', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT' });

