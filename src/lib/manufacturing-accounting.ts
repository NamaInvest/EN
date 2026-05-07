import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ManufacturingAccountingEngine {
    
    /**
     * Completes a Manufacturing Order, calculates the cost variance, 
     * and prepares the accounting entries for the Period Close.
     */
    static async completeOrder(moId: number, completedQty: number, userId: number): Promise<void> {
        const mo = await prisma.manufacturingOrder.findUnique({
            where: { id: moId },
            include: {
                recipe: {
                    include: { finishedProduct: true }
                }
            }
        });

        if (!mo || !mo.recipe) throw new Error("MO or Recipe not found");

        await prisma.$transaction(async (tx) => {
            // 1. Calculate Actual Costs (accumulated during the manufacturing process)
            const actualCosts = await tx.manufacturingCost.aggregate({
                where: { manufacturingOrderId: mo.id },
                _sum: { amount: true }
            });
            const totalActualCost = Number(actualCosts._sum.amount || 0);

            // 2. Calculate Standard Cost
            // Ideally, Standard Cost = completedQty * Standard Unit Cost
            // Here we use the Recipe's pre-calculated totalCost as the standard cost per unit
            const standardUnitCost = Number(mo.recipe.totalCost || 0);
            const totalStandardCost = standardUnitCost * completedQty;

            // 3. Calculate Variance
            // Variance = Actual Cost - Standard Cost
            // Positive Variance = Unfavorable (Costed more than standard)
            // Negative Variance = Favorable (Costed less than standard)
            const varianceAmount = totalActualCost - totalStandardCost;

            // 4. Update Finished Goods Inventory
            const finishedProductId = mo.recipe.finishedProductId;
            
            await tx.product.update({
                where: { id: finishedProductId },
                data: { currentStock: { increment: completedQty } }
            });

            const existingStock = await tx.productStock.findFirst({
                where: {
                    productId: finishedProductId,
                    stockId: mo.stockId
                }
            });

            if (existingStock) {
                await tx.productStock.update({
                    where: { id: existingStock.id },
                    data: { quantity: { increment: completedQty } }
                });
            } else {
                await tx.productStock.create({
                    data: {
                        productId: finishedProductId,
                        stockId: mo.stockId,
                        quantity: completedQty
                    }
                });
            }

            // 5. Create Stock Movement (IN)
            await tx.stockMovement.create({
                data: {
                    productId: finishedProductId,
                    stockId: mo.stockId,
                    type: 'in',
                    quantity: completedQty,
                    notes: `MO #${mo.orderNumber} Completed`,
                    date: new Date(),
                    userId: userId,
                    referenceId: mo.id,
                    referenceType: 'MANUFACTURING_ORDER'
                }
            });

            // 6. Register the Variance for Accounting (Auto-Journal)
            // DR: Finished Goods Inventory (Total Standard Cost)
            // CR: WIP Account (Total Actual Cost)
            // DR/CR: Variance Account (varianceAmount)
            
            // For now, we update the MO with the final variance for the Journal Engine to pick up
            await tx.manufacturingOrder.update({
                where: { id: mo.id },
                data: {
                    status: 'completed',
                    endDate: new Date(),
                    totalCost: totalActualCost,
                    // Note: We can add variance field to DB later, or log it in manufacturing_costs
                }
            });

            // Log the variance as a specific cost type to track it
            if (varianceAmount !== 0) {
                await tx.manufacturingCost.create({
                    data: {
                        manufacturingOrderId: mo.id,
                        costType: 'variance',
                        amount: varianceAmount,
                        description: `Manufacturing Variance (Standard: ${totalStandardCost}, Actual: ${totalActualCost})`
                    }
                });
            }
        });
    }

    /**
     * Updates Standard Costs across all recipes based on current raw material prices.
     * Often run during Period Close or Beginning of Year.
     */
    static async rollupStandardCosts(): Promise<number> {
        let updatedCount = 0;
        const recipes = await prisma.recipe.findMany({
            take: 100,
            include: {
                ingredients: { include: { rawProduct: true } }
            }
        });

        for (const recipe of recipes) {
            let newStandardCost = 0;
            
            for (const ingredient of recipe.ingredients) {
                const requiredQty = Number(ingredient.quantity);
                const scrapFactor = 1 + (Number(ingredient.scrapPercentage) / 100);
                const unitCost = Number(ingredient.rawProduct.buyPrice || 0);
                
                newStandardCost += (requiredQty * scrapFactor * unitCost);
            }

            // Note: Add labor and overhead standards here in the future

            if (Number(recipe.totalCost) !== newStandardCost) {
                await prisma.recipe.update({
                    where: { id: recipe.id },
                    data: { totalCost: newStandardCost }
                });
                updatedCount++;
            }
        }
        
        return updatedCount;
    }
}
