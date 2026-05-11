import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wms-wave-engine' });

export class WmsWaveEngine {
  static async allocateWave(tenantId: string, waveNumber: string): Promise<any> {
    log.info(`Allocating inventory for wave ${waveNumber}`);
    return prisma.wmsWave.update({
      where: { waveNumber },
      data: { status: 'ALLOCATED' }
    });
  }
}
