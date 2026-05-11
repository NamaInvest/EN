import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'oee-engine' });

export class OEEEngine {
  /**
   * OEE = Availability × Performance × Quality
   * World-class target: ≥ 85%
   */
  static calculate(plannedTime: number, runTime: number, idealCycleTime: number, totalCount: number, rejectCount: number) {
    const availability = runTime / plannedTime;
    const performance  = (idealCycleTime * totalCount) / runTime;
    const quality      = (totalCount - rejectCount) / totalCount;
    const oee          = availability * performance * quality;
    return { availability, performance, quality, oee };
  }

  static async record(tenantId: string, machineId: number, shiftId: number | undefined, plannedTime: number, runTime: number, idealCycleTime: number, totalCount: number, rejectCount: number) {
    const metrics = this.calculate(plannedTime, runTime, idealCycleTime, totalCount, rejectCount);
    if (metrics.oee < 0.85) log.warn(`OEE machine ${machineId}: ${(metrics.oee * 100).toFixed(1)}% — below world-class 85%`);
    return prisma.oEERecord.create({ data: { tenantId, machineId, shiftId, ...metrics, totalCount, rejectCount } });
  }

  static async getDashboard(tenantId: string, from: Date, to: Date) {
    return prisma.oEERecord.findMany({ where: { tenantId, recordedAt: { gte: from, lte: to } } });
  }
}
