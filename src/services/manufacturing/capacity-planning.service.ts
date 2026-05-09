/**
 * Capacity Planning Service
 * Uses WorkCenter.capacity + ManufacturingOrder for load analysis
 */
import { PrismaClient } from '@prisma/client';

export interface CapacityLoad {
  workCenterId: number;
  workCenterName: string;
  capacityHours: number;
  loadedHours: number;
  utilizationPct: number;
  status: 'AVAILABLE' | 'NEAR_CAPACITY' | 'OVERLOADED';
}

export class CapacityPlanningService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get capacity load for all work centers in a date range
   */
  async getCapacityLoad(tenantId: string, fromDate: Date, toDate: Date): Promise<CapacityLoad[]> {
    const workCenters = await this.prisma.workCenter.findMany({
      where: { tenantId, isActive: true },
      include: { operations: { include: { recipe: { include: { orders: { where: { tenantId, startDate: { gte: fromDate }, endDate: { lte: toDate }, status: { in: ['draft', 'in_progress'] } }, select: { quantityToProduce: true } } } } } } },
    });

    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const availableHoursPerDay = 8; // 8h workday

    return workCenters.map((wc) => {
      const capacityHours = Number(wc.capacity) * availableHoursPerDay * days;

      // Loaded hours = sum of (operationDuration * orderedQty) for all orders using this work center
      const loadedHours = wc.operations.reduce((total, op) => {
        const orderedQty = op.recipe.orders.reduce((s, o) => s + Number(o.quantityToProduce), 0);
        return total + (Number(op.durationMinutes) / 60) * orderedQty;
      }, 0);

      const utilizationPct = capacityHours > 0 ? (loadedHours / capacityHours) * 100 : 0;

      let status: CapacityLoad['status'] = 'AVAILABLE';
      if (utilizationPct >= 100) status = 'OVERLOADED';
      else if (utilizationPct >= 80) status = 'NEAR_CAPACITY';

      return {
        workCenterId: wc.id,
        workCenterName: wc.name,
        capacityHours: Math.round(capacityHours * 100) / 100,
        loadedHours: Math.round(loadedHours * 100) / 100,
        utilizationPct: Math.round(utilizationPct * 100) / 100,
        status,
      };
    });
  }

  /**
   * Check if production can be scheduled
   */
  async canSchedule(tenantId: string, recipeId: number, quantity: number, startDate: Date): Promise<{
    feasible: boolean;
    bottlenecks: { workCenterName: string; requiredHours: number; availableHours: number }[];
  }> {
    const recipe = await this.prisma.recipe.findFirstOrThrow({
      where: { id: recipeId, tenantId },
      include: { operations: { include: { workCenter: true } } },
    });

    const bottlenecks: { workCenterName: string; requiredHours: number; availableHours: number }[] = [];
    let feasible = true;

    for (const op of recipe.operations) {
      const requiredHours = (Number(op.durationMinutes) / 60) * quantity;
      const availableHours = Number(op.workCenter.capacity) * 8; // 1 day capacity

      if (requiredHours > availableHours) {
        feasible = false;
        bottlenecks.push({ workCenterName: op.workCenter.name, requiredHours, availableHours });
      }
    }

    return { feasible, bottlenecks };
  }
}
