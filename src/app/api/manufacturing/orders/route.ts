import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const orders = await prisma.manufacturingOrder.findMany({
            include: {
                recipe: { include: { finishedProduct: true, ingredients: { include: { rawProduct: true } } } },
                machine: true,
                wastages: true
            },
            orderBy: { id: 'desc' }
        });

        const recipes = await prisma.recipe.findMany({ where: { isActive: true }, include: { finishedProduct: true } });
        const machines = await prisma.machine.findMany({ where: { status: 'active' } });

        return NextResponse.json({ orders, recipes, machines }, { status: 200 });
    } catch (error: any) {
        return apiError(error, 'فشل جلب أوامر التصنيع', { context: 'manufacturing/orders' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        const body = await request.json();
        
        const lastOrder = await prisma.manufacturingOrder.findFirst({ orderBy: { id: 'desc' } });
        const nextId = (lastOrder?.id || 0) + 1;
        const orderNumber = `MFG-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

        const newOrder = await prisma.manufacturingOrder.create({
            data: {
                orderNumber,
                recipeId: parseInt(body.recipeId),
                machineId: body.machineId ? parseInt(body.machineId) : null,
                quantityToProduce: parseFloat(body.quantityToProduce),
                status: 'draft',
                stockId: body.stockId ? parseInt(body.stockId) : 1,
                userId: auth?.userId || null,
                notes: body.notes || ''
            },
            include: { recipe: true, machine: true }
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        return apiError(error, 'Error creating Manufacturing Order', { context: 'manufacturing/orders' });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { id, status, wastageData } = body;

        const currentOrder = await prisma.manufacturingOrder.findUnique({
            where: { id: parseInt(id) },
            include: { recipe: { include: { ingredients: true } } }
        });

        if (!currentOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // If shifting to completed, we must perform Heavy Manufacturing Stock Adjustments
        if (status === 'completed' && currentOrder.status !== 'completed') {
            await prisma.$transaction(async (tx) => {
                let totalMaterialCost = 0;

                // 1. Deduct Raw Materials based on exact BOM (Bill of Materials) formula
                for (const ing of currentOrder.recipe.ingredients) {
                    const requiredQty = ing.quantity * currentOrder.quantityToProduce;
                    
                    const rawProd = await tx.product.update({
                        where: { id: ing.rawProductId },
                        data: { currentStock: { decrement: requiredQty } }
                    });

                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: ing.rawProductId, stockId: currentOrder.stockId } },
                        update: { quantity: { decrement: requiredQty } },
                        create: { productId: ing.rawProductId, stockId: currentOrder.stockId, quantity: -requiredQty }
                    });

                    // We approximate the production cost of the finished good natively from the raw materials' average buy price
                    totalMaterialCost += (rawProd.buyPrice || 0) * requiredQty;
                }

                // 2. Handle specific Scrap/Wastage reported by the factory floor
                if (wastageData && wastageData.length > 0) {
                    for (const waste of wastageData) {
                        const lostQty = parseFloat(waste.lostQuantity);
                        const rawProd = await tx.product.update({
                            where: { id: waste.rawProductId },
                            data: { currentStock: { decrement: lostQty } }
                        });

                        await tx.productStock.update({
                            where: { productId_stockId: { productId: waste.rawProductId, stockId: currentOrder.stockId } },
                            data: { quantity: { decrement: lostQty } }
                        });

                        const lostCost = (rawProd.buyPrice || 0) * lostQty;
                        totalMaterialCost += lostCost; // Wastage natively transfers into the cost of the surviving goods

                        await tx.manufacturingWastage.create({
                            data: {
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
                    const machine = await tx.machine.findUnique({ where: { id: currentOrder.machineId } });
                    if (machine && machine.hourlyCost > 0) {
                        // Assuming basic duration tracking between startDate and now (in hours)
                        const hoursElapsed = Math.abs(new Date().getTime() - currentOrder.startDate.getTime()) / 3600000;
                        overheadCost = hoursElapsed * machine.hourlyCost;
                        totalMaterialCost += overheadCost;
                    }
                }

                // 4. Finalize the Finished Good by INCREMENTING its stock
                const singleUnitCost = totalMaterialCost / currentOrder.quantityToProduce;
                
                await tx.product.update({
                    where: { id: currentOrder.recipe.finishedProductId },
                    data: {
                        currentStock: { increment: currentOrder.quantityToProduce },
                        buyPrice: singleUnitCost // Recalibrates average valuation automatically
                    }
                });

                await tx.productStock.upsert({
                    where: { productId_stockId: { productId: currentOrder.recipe.finishedProductId, stockId: currentOrder.stockId } },
                    update: { quantity: { increment: currentOrder.quantityToProduce } },
                    create: { productId: currentOrder.recipe.finishedProductId, stockId: currentOrder.stockId, quantity: currentOrder.quantityToProduce }
                });

                // Update the original order state natively
                await tx.manufacturingOrder.update({
                    where: { id: currentOrder.id },
                    data: {
                        status: 'completed',
                        endDate: new Date(),
                        totalCost: totalMaterialCost
                    }
                });
            });
            return NextResponse.json({ success: true, message: 'Manufacturing Order Completed successfully with stock mutations' });
        } else {
            // Simple status tracking transition (e.g. Draft -> Processing -> Quality)
            const updated = await prisma.manufacturingOrder.update({
                where: { id: parseInt(id) },
                data: { status }
            });
            return NextResponse.json(updated);
        }
    } catch (error: any) {
        console.error("Manufacturing Validation Error:", error);
        return apiError(error, 'Error altering order matrix', { context: 'manufacturing/orders' });
    }
}
