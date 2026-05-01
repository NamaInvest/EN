import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const orders: any = await prisma.manufacturingOrder.findMany({
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
    } catch (error) {
        console.error("WO GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { recipeId, quantityToProduce, startDate, endDate, machineId } = body;

        const orderNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
    } catch (error) {
        console.error("WO POST error:", error);
        return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { id, status } = body;

        const order: any = await prisma.manufacturingOrder.findUnique({
            where: { id: parseInt(id) },
            include: { recipe: { include: { ingredients: true, operations: { include: { workCenter: true } } } } } as any
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // If status changes to 'in_progress', we simulate Issuing Materials (Raw Materials -> WIP)
        if (status === 'in_progress' && order.status === 'draft') {
            await prisma.$transaction(async (tx) => {
                let totalCost = 0;
                
                // 1. Material Costs
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
                }

                // 2. Overhead Costs (Absorption Engine based on Work Centers and Routing)
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
                    data: { status: 'in_progress', totalCost: totalCost }
                });
            });
        }
        // If status changes to 'completed', WIP -> Finished Goods
        else if (status === 'completed' && order.status === 'in_progress') {
             await prisma.$transaction(async (tx) => {
                 // 1. Mark Order as Completed
                 await tx.manufacturingOrder.update({
                     where: { id: order.id },
                     data: { status: 'completed', endDate: new Date() }
                 });

                 // 2. Increase Finished Product Stock
                 const finishedProduct = await tx.product.findUnique({ where: { id: order.recipe.finishedProductId } });
                 if (finishedProduct) {
                     await tx.product.update({
                         where: { id: finishedProduct.id },
                         data: { currentStock: (finishedProduct.currentStock || 0) + order.quantityToProduce }
                     });
                     
                     // Create Stock Movement log
                     await tx.stockMovement.create({
                         data: {
                             productId: finishedProduct.id,
                             type: 'in',
                             quantity: order.quantityToProduce,
                             notes: `استلام منتج تام من أمر التصنيع ${order.orderNumber}`
                         }
                     });
                 }

                 // 3. Automated WIP Clearing & Variance Accounting (Industry 4.0 Standard)
                 // This creates a Journal Entry automatically to clear WIP and book Finished Goods value
                 const totalActualCost = order.totalCost;
                 const estimatedCost = order.recipe.totalCost * order.quantityToProduce;
                 const variance = totalActualCost - estimatedCost;

                 await tx.journalEntry.create({
                     data: {
                         entryNumber: `JV-MFG-${order.orderNumber}`,
                         entryDate: new Date().toISOString(),
                         description: `إغلاق أمر التصنيع ${order.orderNumber} وإثبات المنتج التام`,
                         reference: order.orderNumber,
                         lines: {
                             create: [
                                 // Debit Finished Goods Inventory (Asset)
                                 { accountId: 1200, debit: estimatedCost, credit: 0, description: 'مخزون الإنتاج التام' },
                                 // Credit WIP Inventory (Asset clearing)
                                 { accountId: 1210, debit: 0, credit: totalActualCost, description: 'تسوية حساب تحت التشغيل' },
                                 // Variance Account (If negative, favourable variance. If positive, unfavourable variance)
                                 { accountId: 5100, debit: variance > 0 ? variance : 0, credit: variance < 0 ? Math.abs(variance) : 0, description: 'انحرافات تكاليف الإنتاج' }
                             ]
                         }
                     }
                 });
             });
        }

        return NextResponse.json({ message: 'تم تحديث حالة الأمر بنجاح' });
    } catch (error) {
        console.error("WO PUT error:", error);
        return NextResponse.json({ error: 'Failed to update work order status' }, { status: 500 });
    }
}
