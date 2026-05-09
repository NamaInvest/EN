/**
 * BOM (Bill of Materials) Service
 * Uses actual Recipe + RecipeIngredient + BOMVersion models
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class BOMService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get full BOM for a product (recipe with ingredients)
   */
  async getBOM(tenantId: string, productId: number): Promise<{
    recipeId: number;
    recipeName: string;
    finishedProductId: number;
    totalCost: number;
    scrapPercentage: number;
    ingredients: { rawProductId: number; productName: string; quantity: number; estimatedCost: number; scrapPct: number }[];
    operations: { workCenterId: number; name: string; durationMinutes: number; costPerHour: number }[];
  } | null> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { tenantId, finishedProductId: productId, isActive: true },
      include: {
        ingredients: { include: { rawProduct: { select: { name: true } } } },
        operations: { include: { workCenter: { select: { name: true, costPerHour: true } } }, orderBy: { sequenceNumber: 'asc' } },
      },
    });

    if (!recipe) return null;

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      finishedProductId: recipe.finishedProductId,
      totalCost: Number(recipe.totalCost),
      scrapPercentage: Number(recipe.scrapPercentage),
      ingredients: recipe.ingredients.map((i) => ({
        rawProductId: i.rawProductId,
        productName: i.rawProduct.name,
        quantity: Number(i.quantity),
        estimatedCost: Number(i.estimatedCost),
        scrapPct: Number(i.scrapPercentage),
      })),
      operations: recipe.operations.map((op) => ({
        workCenterId: op.workCenterId,
        name: `${op.operationName} @ ${op.workCenter.name}`,
        durationMinutes: Number(op.durationMinutes),
        costPerHour: Number(op.workCenter.costPerHour),
      })),
    };
  }

  /**
   * Calculate cost for a production run
   */
  async calculateCost(tenantId: string, recipeId: number, quantity: number): Promise<{
    materialCost: number;
    laborCost: number;
    scrapCost: number;
    totalCost: number;
    perUnitCost: number;
  }> {
    const recipe = await this.prisma.recipe.findFirstOrThrow({
      where: { id: recipeId, tenantId },
      include: {
        ingredients: true,
        operations: { include: { workCenter: true } },
      },
    });

    const materialCost = recipe.ingredients.reduce((s, i) =>
      s + Number(i.estimatedCost) * Number(i.quantity) * quantity, 0);

    const scrapCost = materialCost * (Number(recipe.scrapPercentage) / 100);

    const laborCost = recipe.operations.reduce((s, op) => {
      const hours = Number(op.durationMinutes) / 60;
      return s + hours * Number(op.workCenter.costPerHour) * quantity;
    }, 0);

    const totalCost = materialCost + scrapCost + laborCost;

    return {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      scrapCost: Math.round(scrapCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      perUnitCost: Math.round((totalCost / quantity) * 100) / 100,
    };
  }

  /**
   * Get BOM version history
   */
  async getVersions(tenantId: string, recipeId: number): Promise<{
    id: number;
    versionNumber: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    status: string;
  }[]> {
    const versions = await this.prisma.bOMVersion.findMany({
      where: { tenantId, recipeId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      effectiveFrom: v.effectiveFrom,
      effectiveTo: v.effectiveTo,
      status: v.status,
    }));
  }
}
