import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/numbering';
import { postManufacturingCompletion, postMaterialIssueToWIP } from '@/lib/auto-journal';
import { canTransition, DocumentType } from '@/lib/document-state-machine';
import { InventoryService } from '@/lib/services/inventory.service';
import { ManufacturingService } from '@/lib/services/manufacturing.service';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'manufacturing.work-orders' });

async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    let auth: any = null;
    try { auth = getUserFromRequest(request as any); } catch (e) {}
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const orders: any = await prisma.manufacturingOrder.findMany({ take: 100,
            where: { tenantId },
            include: {
                recipe: {
                    include: { finishedProduct: true, ingredients: { include: { rawProduct: true } } }
                },
                machine: true,
                costs: true
            } as any,
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error: any) {
        EnterpriseLogger.error("WO GET error:", { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  recipeId: z.union([z.string(), z.number()]).optional(),
  quantityToProduce: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    let auth: any = null;
    try { auth = getUserFromRequest(request as any); } catch (e) {}
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const { recipeId, quantityToProduce, startDate, endDate, machineId } = body;

        const { formatted: orderNumber } = await getNextNumber(prisma as any, 'WO');

        const order = await prisma.manufacturingOrder.create({
            data: {
                tenantId,
                orderNumber,
                recipeId: parseInt(recipeId),
                quantityToProduce: parseFloat(quantityToProduce),
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                machineId: machineId ? parseInt(machineId) : null,
                status: 'draft',
                totalCost: 0
            }
        });

        const { logAuditEvent } = await import('@/lib/audit-trail');
        await logAuditEvent(prisma as any, {
            tenantId,
            userId: auth?.userId || null,
            action: 'CREATE',
            entityType: 'ManufacturingWorkOrder',
            entityId: order.id,
            route: '/api/manufacturing/work-orders',
            newData: { orderNumber: order.orderNumber, status: order.status },
            ipAddress: request.headers.get('x-forwarded-for') || null,
        });

        return NextResponse.json({ message: 'تم إنشاء أمر التشغيل بنجاح', data: order });
    } catch (error: any) {
        EnterpriseLogger.error("WO POST error:", { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
    }
}

const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  completionData: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    let auth: any = null;
    try { auth = getUserFromRequest(request as any); } catch (e) {}
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, status, completionData } = body;

        const order: any = await prisma.manufacturingOrder.findFirst({
            where: { id: parseInt(id), tenantId },
            include: { recipe: { include: { ingredients: true, operations: { include: { workCenter: true } } } } } as any
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        if (!canTransition(order.status, status, DocumentType.MANUFACTURING_ORDER)) {
            return NextResponse.json({
                error: `انتقال غير مسموح: لا يمكن تحويل أمر التشغيل من "${order.status}" إلى "${status}"`,
            }, { status: 400 });
        }

        if (status === 'in_progress' && order.status === 'draft') {
            const targetStockId = body.stockId ? parseInt(body.stockId) : 1;

            await runFinancialTx(prisma, async (tx: any) => {
                let totalCost = 0;
                let materialCost = 0;

                for (const item of order.recipe.ingredients) {
                    const scrapPerc = (item as any).scrapPercentage || 0;
                    const qtyNeeded = item.quantity * order.quantityToProduce * (1 + scrapPerc / 100);
                    const cost = item.estimatedCost * order.quantityToProduce;

                    await tx.manufacturingCost.create({
                        data: {
                            tenantId,
                            manufacturingOrderId: order.id,
                            costType: 'material',
                            amount: cost,
                            description: `سحب خامات: ${qtyNeeded.toFixed(2)} وحدة`
                        }
                    });
                    totalCost += cost;
                    materialCost += cost;

                    await InventoryService.adjustStock(tx, {
                        tenantId,
                        productId: item.rawProductId,
                        stockId: targetStockId,
                        quantityChange: -qtyNeeded,
                        reason: `صرف خامات لأمر التصنيع ${order.orderNumber}`,
                        sourceType: 'MANUFACTURING_CONSUMPTION',
                        reference: `MO-${order.id}`
                    });

                    await InventoryService.recordMovement(tx, {
                        tenantId,
                        productId: item.rawProductId,
                        stockId: targetStockId,
                        quantity: -qtyNeeded,
                        type: 'OUT',
                        referenceType: 'manufacturing_order',
                        referenceId: order.id,
                        notes: `صرف خامات لأمر التصنيع ${order.orderNumber}`
                    });

                    await tx.product.update({
                        where: { id: item.rawProductId , tenantId },
                        data: { currentStock: { decrement: qtyNeeded } }
                    });
                }

                for (const op of (order.recipe as any).operations || []) {
                    const hoursNeeded = (op.durationMinutes / 60) * order.quantityToProduce;
                    const overheadCost = hoursNeeded * op.workCenter.costPerHour;
                    if (overheadCost > 0) {
                        await tx.manufacturingCost.create({
                            data: {
                                tenantId,
                                manufacturingOrderId: order.id,
                                costType: 'overhead',
                                amount: overheadCost,
                                description: `تحميل تكاليف صناعية - مركز (${op.workCenter.name}) لمدة ${hoursNeeded.toFixed(2)} ساعة`
                            }
                        });
                        totalCost += overheadCost;
                    }
                }

                await tx.manufacturingOrder.update({
                    where: { id: order.id , tenantId },
                    data: { status: 'in_progress', totalCost }
                });

                if (materialCost > 0) {
                    const journalResult = await postMaterialIssueToWIP({
                        orderNumber: order.orderNumber,
                        materialCost,
                        userId: auth?.userId,
                        branchId: body.branchId ? parseInt(body.branchId) : undefined,
                        txClient: tx
                    });
                    if (!journalResult.success) {
                        throw new Error(`Financial entry failed: ${journalResult.error}`);
                    }
                }

                const { logAuditEvent } = await import('@/lib/audit-trail');
                await logAuditEvent(tx as any, {
                    tenantId,
                    userId: auth?.userId || null,
                    action: 'UPDATE',
                    entityType: 'ManufacturingWorkOrder',
                    entityId: order.id,
                    route: '/api/manufacturing/work-orders',
                    oldData: { status: 'draft' },
                    newData: { status: 'in_progress', materialCost },
                    ipAddress: request.headers.get('x-forwarded-for') || null,
                });
            }, `WO_START_${order.id}`);
            
            EnterpriseLogger.traceInventoryTx(
                `WO_START_${order.id}`,
                'WORK_ORDER_STARTED',
                tenantId,
                { orderId: order.id, orderNumber: order.orderNumber }
            );
        }
        else if (status === 'completed' && order.status === 'in_progress') {
            const yieldQty = completionData?.yieldQty || order.quantityToProduce;
            const yieldWeight = completionData?.yieldWeight || 0;
            const wastageWeight = completionData?.wastageWeight || 0;
            const reason = completionData?.reason || '';
            const wastagePhotoUrl = completionData?.wastagePhotoUrl || '';
            const serialOrBatchNumber = completionData?.serialOrBatchNumber || '';

            const totalActualCost = order.totalCost;
            const standardCost = order.recipe.totalCost * yieldQty;
            const finishedProductName = (order as any).recipe?.finishedProduct?.name;

            const targetStockId = body.stockId ? parseInt(body.stockId) : 1;

            await runFinancialTx(prisma, async (tx: any) => {
                await tx.manufacturingOrder.update({
                    where: { id: order.id , tenantId },
                    data: { 
                        status: 'completed', 
                        endDate: new Date(),
                        yieldQty,
                        yieldWeight
                    }
                });

                if (wastageWeight > 0) {
                    await tx.manufacturingWastage.create({
                        data: {
                            tenantId,
                            manufacturingOrderId: order.id,
                            rawProductId: order.recipe.ingredients[0]?.rawProductId || order.recipe.finishedProductId,
                            lostQuantity: 0,
                            wastageWeight,
                            reason,
                            wastagePhotoUrl,
                            serialOrBatchNumber
                        }
                    });
                }

                const fp = await tx.product.findUnique({ where: { id: order.recipe.finishedProductId , tenantId } });
                if (fp) {
                    await tx.product.update({
                        where: { id: fp.id , tenantId },
                        data: { currentStock: (fp.currentStock || 0) + yieldQty }
                    });

                    // Inventory logic delegated to ManufacturingService outside this financial tx
                }

                const journalResult = await postManufacturingCompletion({
                    orderNumber: order.orderNumber,
                    standardCost,
                    actualCost: totalActualCost,
                    productName: finishedProductName,
                    userId: auth?.userId,
                    branchId: body.branchId ? parseInt(body.branchId) : undefined,
                    txClient: tx
                });

                if (!journalResult.success) {
                    throw new Error(`Financial entry failed: ${journalResult.error}`);
                }

                const { logAuditEvent } = await import('@/lib/audit-trail');
                await logAuditEvent(tx as any, {
                    tenantId,
                    userId: auth?.userId || null,
                    action: 'UPDATE',
                    entityType: 'ManufacturingWorkOrder',
                    entityId: order.id,
                    route: '/api/manufacturing/work-orders',
                    oldData: { status: 'in_progress' },
                    newData: { status: 'completed', totalCost: totalActualCost },
                    ipAddress: request.headers.get('x-forwarded-for') || null,
                });
            }, `WO_COMPLETE_${order.id}`);

            const idempotencyKey = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key') || `mfg-production:${tenantId}:${order.id}:${yieldQty}`;
            
            // Delegate inventory logic & Outbox emission to the dedicated service
            await ManufacturingService.postProduction(prisma as any, {
                tenantId,
                manufacturingOrderId: order.id,
                finishedGoods: [{
                    productId: order.recipe.finishedProductId,
                    stockId: targetStockId,
                    quantity: yieldQty
                }],
                idempotencyKey
            });

            EnterpriseLogger.traceInventoryTx(
                `WO_COMPLETE_${order.id}`,
                'WORK_ORDER_COMPLETED',
                tenantId,
                { orderId: order.id, orderNumber: order.orderNumber }
            );
        }

        return NextResponse.json({ message: 'تم تحديث حالة الأمر بنجاح' });
    } catch (error: any) {
        EnterpriseLogger.error("WO PUT error:", { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: 'Failed to update work order status' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'production'] });

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'mfg_wo_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'mfg_wo_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'mfg_wo_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'mfg_wo_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'production'] });

export const PUT = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'mfg_wo_put', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _PUT(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'mfg_wo_put', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'mfg_wo_put', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'mfg_wo_put', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'production'] });
