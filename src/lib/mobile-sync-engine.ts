import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'mobile-sync-engine' });

export class MobileSyncEngine {
  static async registerDevice(tenantId: string, userId: string, deviceId: string): Promise<any> {
    log.info(`Registering device ${deviceId} for user ${userId}`);
    return prisma.mobileDevice.upsert({
      where: { deviceId },
      update: { lastSyncAt: new Date(), userId },
      create: { tenantId, deviceId, userId, lastSyncAt: new Date() }
    });
  }
}
