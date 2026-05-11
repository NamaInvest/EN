import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'mes-engine' });

export class MESEngine {
  static async recordEvent(stationId: number, eventType: string, quantity?: number, rejectReason?: string) {
    log.info(`MES event: station ${stationId} → ${eventType}`);
    return prisma.shopfloorEvent.create({ data: { stationId, eventType, quantity, rejectReason } });
  }

  static async updateStationStatus(stationId: number, status: string, operatorId?: number, currentWoId?: number) {
    return prisma.shopfloorStation.update({ where: { id: stationId }, data: { status, operatorId, currentWoId, lastHeartbeat: new Date() } });
  }

  static async getDashboard(tenantId: string) {
    return prisma.shopfloorStation.findMany({ where: { tenantId } });
  }
}
