/**
 * Production Routing Service
 * Uses RecipeOperation + WorkCenter for step-by-step routing
 */
import { PrismaClient } from '@prisma/client';

export interface RoutingStep {
  step: number;
  operationName: string;
  workCenterName: string;
  durationMinutes: number;
  costPerHour: number;
  estimatedCost: number;
}

export class RoutingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get production routing for a recipe
   */
  async getRouting(tenantId: string, recipeId: number): Promise<RoutingStep[]> {
    const operations = await this.prisma.recipeOperation.findMany({
      where: { tenantId, recipeId },
      include: { workCenter: true },
      orderBy: { sequenceNumber: 'asc' },
    });

    return operations.map((op, idx) => ({
      step: op.sequenceNumber,
      operationName: op.operationName,
      workCenterName: op.workCenter.name,
      durationMinutes: Number(op.durationMinutes),
      costPerHour: Number(op.workCenter.costPerHour),
      estimatedCost: (Number(op.durationMinutes) / 60) * Number(op.workCenter.costPerHour),
    }));
  }

  /**
   * Calculate total routing time and cost for a batch
   */
  async calculateRoutingCost(tenantId: string, recipeId: number, quantity: number): Promise<{
    totalMinutes: number;
    totalHours: number;
    totalCost: number;
    steps: RoutingStep[];
    criticalPath: string;
  }> {
    const steps = await this.getRouting(tenantId, recipeId);
    const totalMinutes = steps.reduce((s, op) => s + op.durationMinutes * quantity, 0);
    const totalCost = steps.reduce((s, op) => s + op.estimatedCost * quantity, 0);

    const criticalStep = steps.reduce((max, op) => op.durationMinutes > max.durationMinutes ? op : max, steps[0]);

    return {
      totalMinutes: Math.round(totalMinutes * 100) / 100,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      steps,
      criticalPath: criticalStep ? criticalStep.operationName : 'N/A',
    };
  }

  /**
   * Get work center utilization for all recipes
   */
  async getWorkCenterRoutes(tenantId: string, workCenterId: number): Promise<{
    recipeId: number;
    recipeName: string;
    operationName: string;
    durationMinutes: number;
  }[]> {
    const operations = await this.prisma.recipeOperation.findMany({
      where: { tenantId, workCenterId },
      include: { recipe: { select: { id: true, name: true } } },
    });

    return operations.map((op) => ({
      recipeId: op.recipe.id,
      recipeName: op.recipe.name,
      operationName: op.operationName,
      durationMinutes: Number(op.durationMinutes),
    }));
  }
}
