import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/numbering';
import { postManufacturingCompletion, postMaterialIssueToWIP } from '@/lib/auto-journal';
import { canTransition, DocumentType } from '@/lib/document-state-machine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const orders: any = await prisma.manufacturingOrder.findMany({
            take: 100,
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
        console.error("WO GET error:", error);
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
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const { recipeId, quantityToProduce, startDate, endDate, machineId } = body;

        const { formatted: orderNumber } = await getNextNumber(prisma as any, 'WO');

        const order = await prisma.manufacturingOrder.create({
            data: {
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

        return NextResponse.json({ message: 'تم إنشاء أمر التشغيل بنجاح', data: order });
    } catch (error: any) {
        console.error("WO POST error:", error);
        return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  completionData: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { id, status, completionData } = body;

        const order: any = await prisma.manufacturingOrder.findUnique({
            where: { id: parseInt(id) },
            include: { recipe: { include: { ingredients: true, operations: { include: { workCenter: true } } } } } as any
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Validate state transition before any side effects
        if (!canTransition(order.status, status, DocumentType.MANUFACTURING_ORDER)) {
            return NextResponse.json({
                error: `انتقال غير مسموح: لا يمكن تحويل أمر التشغيل من "${order.status}" إلى "${status}"`,
            }, { status: 400 });
        }

        // ─── draft → in_progress: Issue materials & overhead to WIP ──────
        if (status === 'in_progress' && order.status === 'draft') {
            const { materialCost } = await prisma.$transaction(async (tx) => {
                let totalCost = 0;
                let materialCost = 0;

                // 1. Material costs (per ingredient with scrap percentage)
                for (const item of order.recipe.ingredients) {
                    const scrapPerc = (item as any).scrapPercentage || 0;
                    const qtyNeeded = item.quantity * order.quantityToProduce * (1 + scrapPerc / 100);
                    const cost = item.estimatedCost * order.quantityToProduce;

                    await (tx as any).manufacturingCost.create({
                        data: {
                            manufacturingOrderId: order.id,
                            costType: 'material',
                            amount: cost,
                            description: `سحب خامات: ${qtyNeeded.toFixed(2)} وحدة`
                        }
                    });
                    totalCost += cost;
                    materialCost += cost;
                }

                // 2. Overhead costs (Work-Center hourly rate × routing duration)
                for (const op of (order.recipe as any).operations || []) {
                    const hoursNeeded = (op.durationMinutes / 60) * order.quantityToProduce;
                    const overheadCost = hoursNeeded * op.workCenter.costPerHour;
                    if (overheadCost > 0) {
                        await (tx as any).manufacturingCost.create({
                            data: {
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
                    where: { id: order.id },
                    data: { status: 'in_progress', totalCost }
                });

                return { totalCost, materialCost };
            });

            // 3. Auto-journal: Dr WIP / Cr Raw Materials (issuance)
            //    Done OUTSIDE the tx because auto-journal opens its own atomic flow.
            if (materialCost > 0) {
                await postMaterialIssueToWIP({
                    orderNumber: order.orderNumber,
                    materialCost,
                });
            }
        }
        // ─── in_progress → completed: WIP → Finished Goods ──────────────
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

            await prisma.$transaction(async (tx: any) => {
                // 1. Mark order completed
                await tx.manufacturingOrder.update({
                    where: { id: order.id },
                    data: { 
                        status: 'completed', 
                        endDate: new Date(),
                        yieldQty,
                        yieldWeight
                    }
                });

                // 2. Log Wastage if applicable
                if (wastageWeight > 0) {
                    await tx.manufacturingWastage.create({
                        data: {
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

                // 3. Increase finished-product stock + log movement
                const fp = await tx.product.findUnique({ where: { id: order.recipe.finishedProductId } });
                if (fp) {
                    await tx.product.update({
                        where: { id: fp.id },
                        data: { currentStock: (fp.currentStock || 0) + yieldQty }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: fp.id,
                            type: 'in',
                            quantity: yieldQty,
                            notes: `استلام منتج تام من أمر التصنيع ${order.orderNumber} ${serialOrBatchNumber ? '(دفعة: ' + serialOrBatchNumber + ')' : ''}`
                        }
                    });
                }
            });

            // 3. Auto-journal: Dr FG / Cr WIP / Variance
            //    Uses account-code lookup (not hardcoded IDs) and balance updates
            //    handled centrally — complies with CLAUDE.md §3.1.
            await postManufacturingCompletion({
                orderNumber: order.orderNumber,
                standardCost,
                actualCost: totalActualCost,
                productName: finishedProductName,
            });
        }

        return NextResponse.json({ message: 'تم تحديث حالة الأمر بنجاح' });
    } catch (error: any) {
        console.error("WO PUT error:", error);
        return NextResponse.json({ error: 'Failed to update work order status' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
