import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'territory-engine' });

export class TerritoryEngine {
  static async createTerritory(tenantId: string, code: string, name: string, managerId: number, regions: object) {
    return prisma.salesTerritory.create({ data: { tenantId, code, name, managerId, regions } });
  }

  static async setQuota(tenantId: string, userId: number, period: string, quotaAmount: number) {
    return prisma.salesQuota.create({ data: { tenantId, userId, period, quotaAmount, actualAmount: 0 } });
  }

  static async updateActual(tenantId: string, userId: number, period: string, actualAmount: number) {
    return prisma.salesQuota.updateMany({ where: { tenantId, userId, period }, data: { actualAmount } });
  }

  static async getAttainment(tenantId: string, period: string) {
    const quotas = await prisma.salesQuota.findMany({ where: { tenantId, period } });
    return quotas.map(q => ({
      userId: q.userId,
      quota: Number(q.quotaAmount),
      actual: Number(q.actualAmount),
      attainmentPct: Number(q.quotaAmount) > 0 ? (Number(q.actualAmount) / Number(q.quotaAmount)) * 100 : 0,
    }));
  }
}
