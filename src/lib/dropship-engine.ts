import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'dropship-engine' });

export class DropShipEngine {
  static async linkSOtoPO(soId: number, poId: number) {
    log.info(`Linking drop-ship SO ${soId} → PO ${poId}`);
    return prisma.dropShipLink.create({ data: { soId, poId } });
  }

  static async confirmShipment(soId: number, trackingNumber: string, carrierId?: number) {
    return prisma.dropShipLink.updateMany({ where: { soId }, data: { trackingNumber, carrierId } });
  }

  static async getLink(soId: number) {
    return prisma.dropShipLink.findFirst({ where: { soId } });
  }
}
