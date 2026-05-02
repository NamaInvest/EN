import { PrismaClient, ManufacturingOrder, StockMovement, ProductStock } from '@prisma/client';

const prisma = new PrismaClient();

export class MaterialIssuanceEngine {
    
    /**
     * Creates a Picklist (Material Issuance Draft) for a given Manufacturing Order
     * based on its recipe and quantity.
     */
    static async generatePicklist(moId: number): Promise<any> {
        const mo = await prisma.manufacturingOrder.findUnique({
            where: { id: moId },
            include: {
                recipe: {
                    include: {
                        ingredients: {
                            include: { rawProduct: true }
                        }
                    }
                }
            }
        });

        if (!mo || !mo.recipe) throw new Error("Manufacturing Order or Recipe not found");

        const targetQty = Number(mo.quantityToProduce || 0);
        
        const picklist = mo.recipe.ingredients.map(ingredient => {
            const requiredQty = Number(ingredient.quantity) * targetQty;
            const scrapFactor = 1 + (Number(ingredient.scrapPercentage) / 100);
            
            return {
                rawProductId: ingredient.rawProductId,
                productName: ingredient.rawProduct.name,
                unitRequired: requiredQty * scrapFactor,
                currentStock: ingredient.rawProduct.currentStock,
                estimatedCost: Number(ingredient.rawProduct.buyPrice || 0) * requiredQty * scrapFactor
            };
        });

        return {
            moId: mo.id,
            moNumber: mo.orderNumber,
            status: mo.status,
            items: picklist
        };
    }

    /**
     * Auto-issues materials (Backflushing) based on the completed quantity.
     * Moves raw materials out of inventory and books Manufacturing Costs.
     */
    static async executeBackflushing(moId: number, completedQty: number, userId: number, stockId: number): Promise<void> {
        const mo = await prisma.manufacturingOrder.findUnique({
            where: { id: moId },
            include: {
                recipe: {
                    include: {
                        ingredients: true
                    }
                }
            }
        });

        if (!mo || !mo.recipe) throw new Error("Manufacturing Order or Recipe not found");

        // Use a transaction for data integrity
        await prisma.$transaction(async (tx) => {
            let totalMaterialCost = 0;

            for (const ingredient of mo.recipe.ingredients) {
                const qtyToConsume = Number(ingredient.quantity) * completedQty;
                
                const product = await tx.product.findUnique({ where: { id: ingredient.rawProductId }});
                if (!product) continue;

                const cost = Number(product.buyPrice || 0) * qtyToConsume;
                totalMaterialCost += cost;

                // 1. Deduct Stock
                await tx.product.update({
                    where: { id: ingredient.rawProductId },
                    data: { currentStock: { decrement: qtyToConsume } }
                });

                // Update ProductStock link
                await tx.productStock.upsert({
                    where: {
                        productId_stockId: {
                            productId: ingredient.rawProductId,
                            stockId: stockId
                        }
                    },
                    update: { quantity: { decrement: qtyToConsume } },
                    create: {
                        productId: ingredient.rawProductId,
                        stockId: stockId,
                        quantity: -qtyToConsume
                    }
                });

                // 2. Create StockMovement (OUT)
                await tx.stockMovement.create({
                    data: {
                        productId: ingredient.rawProductId,
                        stockId: stockId,
                        type: 'out',
                        quantity: qtyToConsume,
                        notes: `Backflushing for MO #${mo.orderNumber}`,
                        date: new Date(),
                        userId: userId,
                        referenceId: mo.id,
                        referenceType: 'MANUFACTURING_ORDER'
                    }
                });
            }

            // 3. Register Manufacturing Cost (Material)
            await tx.manufacturingCost.create({
                data: {
                    manufacturingOrderId: mo.id,
                    costType: 'material',
                    amount: totalMaterialCost,
                    description: `Auto-backflushed materials for ${completedQty} units`
                }
            });

            // 4. Update MO Total Cost
            await tx.manufacturingOrder.update({
                where: { id: mo.id },
                data: { totalCost: { increment: totalMaterialCost } }
            });
            
            // Note: Generating Accounting JEs (DR WIP, CR Raw Materials) would be triggered here
            // via the AutoJournal Engine.
        });
    }
}
