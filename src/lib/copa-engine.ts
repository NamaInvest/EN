import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'copa-engine' });

export class COPAEngine {
  /** CO-PA: allocate cost center costs to profitability dimensions */
  static async createAllocation(sourceCC: number, targetDim: string, allocationKey: string, percent: number) {
    if (percent <= 0 || percent > 100) throw new Error('Percent must be 1-100');
    return prisma.copaAllocation.create({ data: { sourceCC, targetDim, allocationKey, percent } });
  }

  static async runAllocation(sourceCC: number, period: string, totalCost: number) {
    const allocations = await prisma.copaAllocation.findMany({ where: { sourceCC } });
    const totalPct = allocations.reduce((s, a) => s + Number(a.percent), 0);
    if (Math.abs(totalPct - 100) > 0.01) log.warn(`Allocations for CC ${sourceCC} sum to ${totalPct}%, not 100%`);
    return allocations.map(a => ({
      targetDim: a.targetDim,
      allocationKey: a.allocationKey,
      percent: Number(a.percent),
      allocatedAmount: (totalCost * Number(a.percent)) / 100,
    }));
  }
}
