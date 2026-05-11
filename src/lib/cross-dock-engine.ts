import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cross-dock-engine' });

export class CrossDockEngine {
  static async createAssignment(tenantId: string, grnId: number, soId: number, itemId: number, quantity: number) {
    log.info(`Cross-dock: GRN ${grnId} → SO ${soId}, item ${itemId}, qty ${quantity}`);
    return prisma.crossDockAssignment.create({ data: { tenantId, grnId, soId, itemId, quantity, status: 'PENDING' } });
  }

  static async complete(id: number) {
    return prisma.crossDockAssignment.update({ where: { id }, data: { status: 'COMPLETED' } });
  }
}
