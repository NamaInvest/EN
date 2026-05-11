import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bad-debt-engine' });

export class BadDebtEngine {
  static async createProvision(tenantId: string, customerId: number, period: string, amount: number, reason?: string) {
    log.info(`Creating bad debt provision for customer ${customerId}: ${amount}`);
    return prisma.badDebtProvision.create({
      data: { tenantId, customerId, period, provisionAmount: amount, reason, approvalStatus: 'PENDING' },
    });
  }

  static async approve(id: number) {
    return prisma.badDebtProvision.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
  }

  static async getMovement(tenantId: string, period: string) {
    return prisma.badDebtProvision.findMany({ where: { tenantId, period } });
  }
}
