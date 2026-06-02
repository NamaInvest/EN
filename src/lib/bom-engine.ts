import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bom-engine' });

/**
 * I-10: BOM Where-Used — uses Recipe + RecipeIngredient (actual schema)
 * RecipeIngredient fields: rawProductId, quantity, estimatedCost
 * Recipe fields: finishedProductId, name, totalCost
 */
export class BOMEngine {
  /** Find all Recipes that use a given raw product as ingredient */
  static async whereUsed(rawProductId: number, tenantId: string) {
    const ingredients = await prisma.recipeIngredient.findMany({
      where: { rawProductId },
      include: { recipe: { select: { id: true, name: true, tenantId: true, finishedProductId: true } } },
    });
    return ingredients
      .filter(i => i.recipe.tenantId === tenantId)
      .map(i => ({
        recipeId: i.recipeId,
        recipeName: i.recipe.name,
        finishedProductId: i.recipe.finishedProductId,
        quantity: Number(i.quantity),
        estimatedCost: Number(i.estimatedCost),
      }));
  }

  /** Explode a recipe's ingredients recursively */
  static async explode(recipeId: number, depth = 0, maxDepth = 5): Promise<object[]> {
    if (depth >= maxDepth) return [];
    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
      include: { rawProduct: { select: { id: true, name: true, barcode: true } } },
    });
    
    if (ingredients.length === 0) return [];
    
    // Solve N+1: Batch fetch all child recipes for current ingredients in one query
    const rawProductIds = ingredients.map(i => i.rawProductId);
    const childRecipesList = await prisma.recipe.findMany({
      where: { finishedProductId: { in: rawProductIds } },
      select: { id: true, finishedProductId: true }
    });
    
    // Map finishedProductId to recipe for O(1) memory lookup
    const recipeMap = new Map<number, { id: number; finishedProductId: number }>();
    for (const r of childRecipesList) {
      recipeMap.set(r.finishedProductId, r);
    }
    
    const result = [];
    for (const i of ingredients) {
      const childRecipe = recipeMap.get(i.rawProductId);
      const children = childRecipe ? await this.explode(childRecipe.id, depth + 1, maxDepth) : [];
      result.push({
        depth,
        rawProductId: i.rawProductId,
        name: i.rawProduct.name,
        barcode: i.rawProduct.barcode ?? '',
        quantity: Number(i.quantity),
        estimatedCost: Number(i.estimatedCost),
        children,
      });
    }
    return result;
  }

  /** Get total estimated cost from recipe ingredients */
  static async calculateCost(recipeId: number): Promise<{ totalCost: number; lines: object[] }> {
    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
      include: { rawProduct: { select: { id: true, name: true } } },
    });
    const lines = ingredients.map(i => ({
      rawProductId: i.rawProductId,
      name: i.rawProduct.name,
      quantity: Number(i.quantity),
      estimatedCost: Number(i.estimatedCost),
      lineCost: Number(i.quantity) * Number(i.estimatedCost),
    }));
    const totalCost = lines.reduce((s, l) => s + l.lineCost, 0);
    return { totalCost, lines };
  }
}
