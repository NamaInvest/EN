import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'eco-engine' });

export class ECOEngine {
  /** Use existing EngineeringChangeOrder schema fields */
  static async create(tenantId: string, data: {
    productId: number;
    reason: string;
    effectiveDate?: Date;
    requestedBy: number;
    fromBomVersionId?: number;
    toBomVersionId?: number;
  }) {
    const ecoNumber = `ECO-${Date.now()}`;
    log.info(`Creating ECO ${ecoNumber}`);
    return prisma.engineeringChangeOrder.create({
      data: {
        tenantId,
        ecoNumber,
        productId: data.productId,
        reason: data.reason,
        effectiveDate: data.effectiveDate,
        requestedBy: data.requestedBy,
        fromBomVersionId: data.fromBomVersionId,
        toBomVersionId: data.toBomVersionId,
        status: 'PENDING',
      },
    });
  }

  static async submitForApproval(id: number) {
    return prisma.engineeringChangeOrder.update({ where: { id }, data: { status: 'PENDING' } });
  }

  static async approve(id: number, approvedBy: number) {
    return prisma.engineeringChangeOrder.update({ where: { id }, data: { status: 'APPROVED', approvedBy } });
  }

  static async implement(id: number) {
    return prisma.engineeringChangeOrder.update({ where: { id }, data: { status: 'IMPLEMENTED' } });
  }
}
