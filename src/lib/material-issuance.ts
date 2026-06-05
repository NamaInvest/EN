import { StockMovement, ProductStock } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'material-issuance' });

export class MaterialIssuanceEngine {
    
    /**
     * Creates a Picklist (Material Issuance Draft) for a given Manufacturing Order
     * based on its recipe and quantity.
     * Enforces strict tenant isolation and uses passed prisma transaction context.
     */
    static async generatePicklist(prisma: any, moId: number, tenantId: string): Promise<any> {
        if (!tenantId) {
            throw new Error("Missing tenantId context for generatePicklist");
        }

        const mo = await prisma.manufacturingOrder.findFirst({
            where: { id: moId, tenantId },
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

        if (!mo || !mo.recipe) {
            throw new Error("Manufacturing Order or Recipe not found for this tenant");
        }

        const targetQty = Number(mo.quantityToProduce || 0);
        
        const picklist = mo.recipe.ingredients.map((ingredient: any) => {
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
     * Enforces strict tenant isolation, idempotency checks, and transaction safety.
     */
    static async executeBackflushing(
        prisma: any, 
        moId: number, 
        completedQty: number, 
        userId: number, 
        stockId: number,
        tenantId: string
    ): Promise<void> {
        if (!tenantId) {
            throw new Error("Missing tenantId context for executeBackflushing");
        }

        if (completedQty <= 0) {
            throw new Error("Completed quantity must be greater than zero");
        }

        const mo = await prisma.manufacturingOrder.findFirst({
            where: { id: moId, tenantId },
            include: {
                recipe: {
                    include: {
                        ingredients: true
                    }
                }
            }
        });

        if (!mo || !mo.recipe) {
            throw new Error("Manufacturing Order or Recipe not found for this tenant");
        }

        // Idempotency/Concurrency Guard: Check if the MO is already completed or cancelled
        if (mo.status === 'completed' || mo.status === 'cancelled') {
            throw new Error(`Cannot perform backflushing: Manufacturing Order status is ${mo.status}`);
        }

        // Use transaction for database integrity and isolation
        await prisma.$transaction(async (tx: any) => {
            let totalMaterialCost = 0;

            for (const ingredient of mo.recipe.ingredients) {
                const qtyToConsume = Number(ingredient.quantity) * completedQty;
                
                // Enforce tenant isolation on product lookup
                const product = await tx.product.findFirst({
                    where: { id: ingredient.rawProductId, tenantId }
                });
                if (!product) {
                    throw new Error(`Product not found or unauthorized for tenant: ${ingredient.rawProductId}`);
                }

                const cost = Number(product.buyPrice || 0) * qtyToConsume;
                totalMaterialCost += cost;

                // 1. Deduct Stock (Enforce tenantId)
                await tx.product.updateMany({
                    where: { id: ingredient.rawProductId, tenantId },
                    data: { currentStock: { decrement: qtyToConsume } }
                });

                // Update ProductStock link (Enforce tenantId)
                const existingStock = await tx.productStock.findFirst({
                    where: {
                        productId: ingredient.rawProductId,
                        stockId: stockId,
                        tenantId
                    }
                });

                if (existingStock) {
                    await tx.productStock.updateMany({
                        where: { id: existingStock.id, tenantId },
                        data: { quantity: { decrement: qtyToConsume } }
                    });
                } else {
                    await tx.productStock.create({
                        data: {
                            productId: ingredient.rawProductId,
                            stockId: stockId,
                            quantity: -qtyToConsume,
                            tenantId
                        }
                    });
                }

                // 2. Create StockMovement (OUT) (Enforce tenantId)
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
                        referenceType: 'MANUFACTURING_ORDER',
                        tenantId
                    }
                });
            }

            // 3. Register Manufacturing Cost (Material) (Enforce tenantId)
            await tx.manufacturingCost.create({
                data: {
                    tenantId,
                    manufacturingOrderId: mo.id,
                    costType: 'material',
                    amount: totalMaterialCost,
                    description: `Auto-backflushed materials for ${completedQty} units`
                }
            });

            // 4. Update MO Total Cost (Enforce tenantId)
            await tx.manufacturingOrder.updateMany({
                where: { id: mo.id, tenantId },
                data: { totalCost: { increment: totalMaterialCost } }
            });
            
            // Note: Generating Accounting JEs (DR WIP, CR Raw Materials) would be triggered here
            // via the AutoJournal Engine.
        });
    }
}

