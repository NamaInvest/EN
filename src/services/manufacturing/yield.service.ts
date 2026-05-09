/**
 * Production Yield Service
 * Uses ManufacturingOrder + ManufacturingWastage + Recipe yield fields
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class YieldService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Record actual yield for a completed order
   */
  async recordYield(tenantId: string, orderId: number, data: {
    yieldQty: number;
    yieldWeight?: number;
    wastages?: { rawProductId: number; lostQuantity: number; wastedCost: number; reason?: string }[];
  }): Promise<{ yieldVariancePct: number; scrappedValue: number }> {
    const order = await this.prisma.manufacturingOrder.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: { recipe: { select: { expectedYieldQty: true, totalCost: true } } },
    });

    // Update order with actual yield
    await this.prisma.manufacturingOrder.update({
      where: { id: orderId },
      data: { yieldQty: new Decimal(data.yieldQty), yieldWeight: data.yieldWeight ? new Decimal(data.yieldWeight) : undefined },
    });

    // Record wastages
    if (data.wastages?.length) {
      await this.prisma.manufacturingWastage.createMany({
        data: data.wastages.map((w) => ({
          tenantId,
          manufacturingOrderId: orderId,
          rawProductId: w.rawProductId,
          lostQuantity: new Decimal(w.lostQuantity),
          wastedCost: new Decimal(w.wastedCost),
          reason: w.reason,
        })),
      });
    }

    const expectedQty = Number(order.recipe.expectedYieldQty ?? order.quantityToProduce);
    const yieldVariancePct = expectedQty > 0
      ? ((data.yieldQty - expectedQty) / expectedQty) * 100
      : 0;

    const scrappedValue = (data.wastages ?? []).reduce((s, w) => s + w.wastedCost, 0);

    return { yieldVariancePct: Math.round(yieldVariancePct * 100) / 100, scrappedValue };
  }

  /**
   * Yield analysis for a period
   */
  async getYieldAnalysis(tenantId: string, fromDate: Date, toDate: Date): Promise<{
    orderId: number;
    orderNumber: string;
    recipeId: number;
    quantityToProduce: number;
    actualYield: number;
    yieldRate: number;
    scrapQty: number;
    scrapCost: number;
  }[]> {
    const orders = await this.prisma.manufacturingOrder.findMany({
      where: {
        tenantId,
        status: 'completed',
        startDate: { gte: fromDate },
        endDate: { lte: toDate },
        yieldQty: { not: null },
      },
      include: { wastages: { select: { lostQuantity: true, wastedCost: true } } },
    });

    return orders.map((o) => {
      const scrapQty = o.wastages.reduce((s, w) => s + Number(w.lostQuantity), 0);
      const scrapCost = o.wastages.reduce((s, w) => s + Number(w.wastedCost), 0);
      const actualYield = Number(o.yieldQty ?? 0);
      const planned = Number(o.quantityToProduce);

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        recipeId: o.recipeId,
        quantityToProduce: planned,
        actualYield,
        yieldRate: planned > 0 ? Math.round((actualYield / planned) * 10000) / 100 : 0,
        scrapQty,
        scrapCost,
      };
    });
  }
}
