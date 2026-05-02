// @ts-nocheck
import { PrismaClient, Recipe, RecipeIngredient, BOMVersion, EngineeringChangeOrder } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExplodedBOMNode {
    productId: number;
    productName: string;
    level: number;
    quantityRequired: number;
    unitPrice: number;
    totalCost: number;
    isLeaf: boolean;
    children: ExplodedBOMNode[];
}

export class BOMEngine {
    /**
     * Recursively explodes a BOM to find all raw materials required for a given quantity.
     * Handles multi-level BOMs (where ingredients are themselves manufactured products).
     */
    static async explodeBOM(productId: number, targetQty: number, currentLevel: number = 0): Promise<ExplodedBOMNode> {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) throw new Error(`Product ${productId} not found`);

        // Check if there is an active recipe for this product
        const recipe = await prisma.recipe.findFirst({
            where: { 
                finishedProductId: productId,
                isActive: true 
            },
            include: {
                ingredients: {
                    include: { rawProduct: true }
                }
            }
        });

        const node: ExplodedBOMNode = {
            productId: product.id,
            productName: product.name,
            level: currentLevel,
            quantityRequired: targetQty,
            unitPrice: Number(product.buyPrice || 0),
            totalCost: targetQty * Number(product.buyPrice || 0),
            isLeaf: !recipe, // If no recipe, it's a raw material (leaf node)
            children: []
        };

        if (recipe) {
            // It's a sub-assembly or finished good
            let totalChildrenCost = 0;
            
            // Note: In real life we'd account for scrapPercentage here
            const yieldFactor = 1 - (Number(recipe.scrapPercentage) / 100);
            const actualQtyNeeded = targetQty / yieldFactor;

            for (const ingredient of recipe.ingredients) {
                const childQty = Number(ingredient.quantity) * actualQtyNeeded;
                
                // Recursively explode
                const childNode = await this.explodeBOM(ingredient.rawProductId, childQty, currentLevel + 1);
                node.children.push(childNode);
                totalChildrenCost += childNode.totalCost;
            }
            
            // Re-calculate cost based on children for sub-assemblies
            node.totalCost = totalChildrenCost; 
            node.unitPrice = totalChildrenCost / targetQty;
        }

        return node;
    }

    /**
     * Where-Used Analysis: Finds all parent recipes that use a specific component.
     */
    static async findUsages(componentProductId: number): Promise<any[]> {
        const usages = await prisma.recipeIngredient.findMany({
            where: { rawProductId: componentProductId },
            include: {
                recipe: {
                    include: { finishedProduct: true }
                }
            }
        });

        return usages.map(u => ({
            recipeId: u.recipeId,
            recipeName: u.recipe.name,
            parentProductId: u.recipe.finishedProductId,
            parentProductName: u.recipe.finishedProduct.name,
            qtyUsedPerParent: u.quantity
        }));
    }

    /**
     * Creates a new BOM Version for a recipe.
     */
    static async createBOMVersion(recipeId: number, versionNumber: string, effectiveFrom: Date): Promise<BOMVersion> {
        // Obsolete previous active versions that overlap
        await prisma.bOMVersion.updateMany({
            where: { 
                recipeId, 
                status: 'ACTIVE',
                effectiveTo: null
            },
            data: { 
                effectiveTo: effectiveFrom,
                status: 'OBSOLETE'
            }
        });

        return await prisma.bOMVersion.create({
            data: {
                recipeId,
                versionNumber,
                effectiveFrom,
                status: 'ACTIVE'
            }
        });
    }

    /**
     * Submit an Engineering Change Order (ECO)
     */
    static async submitECO(
        productId: number, 
        fromVersionId: number | null, 
        toVersionId: number | null, 
        reason: string, 
        userId: number
    ): Promise<EngineeringChangeOrder> {
        const ecoNumber = `ECO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        return await prisma.engineeringChangeOrder.create({
            data: {
                ecoNumber,
                productId,
                fromBomVersionId: fromVersionId,
                toBomVersionId: toVersionId,
                reason,
                status: 'PENDING',
                requestedBy: userId
            }
        });
    }

    /**
     * Approve and Implement ECO
     */
    static async approveECO(ecoId: number, approverId: number): Promise<EngineeringChangeOrder> {
        const eco = await prisma.engineeringChangeOrder.findUnique({
            where: { id: ecoId }
        });

        if (!eco) throw new Error("ECO not found");

        // Implement logic (simplified)
        const now = new Date();
        
        if (eco.fromBomVersionId) {
            await prisma.bOMVersion.update({
                where: { id: eco.fromBomVersionId },
                data: { effectiveTo: now, status: 'OBSOLETE' }
            });
        }
        
        if (eco.toBomVersionId) {
            await prisma.bOMVersion.update({
                where: { id: eco.toBomVersionId },
                data: { effectiveFrom: now, status: 'ACTIVE' }
            });
        }

        return await prisma.engineeringChangeOrder.update({
            where: { id: ecoId },
            data: {
                status: 'IMPLEMENTED',
                approvedBy: approverId,
                approvedAt: now,
                effectiveDate: now
            }
        });
    }
}
