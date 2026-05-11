import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inventory-bin-engine' });

export class InventoryBinEngine {
  static async checkCapacity(tenantId: string, warehouseId: number, binCode: string): Promise<any> {
    log.info(`Checking capacity for bin ${binCode}`);
    return prisma.inventoryBin.findUnique({
      where: { warehouseId_binCode: { warehouseId, binCode } }
    });
  }
}
