import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'blanket-po-engine' });

export class BlanketPOEngine {
  static async create(tenantId: string, data: { poNumber: string; vendorId: number; validFrom: Date; validTo: Date; totalValue: number }) {
    return prisma.blanketPO.create({ data: { tenantId, ...data, remainingValue: data.totalValue, consumedValue: 0 } });
  }

  static async release(blanketPoId: number, releaseNumber: string, quantity: number, amount: number) {
    const po = await prisma.blanketPO.findUniqueOrThrow({ where: { id: blanketPoId } });
    if (amount > Number(po.remainingValue)) throw new Error('Release exceeds remaining blanket PO value');
    log.info(`Releasing ${amount} from blanket PO ${blanketPoId}`);
    await prisma.blanketPO.update({ where: { id: blanketPoId }, data: { consumedValue: { increment: amount }, remainingValue: { decrement: amount } } });
    return prisma.blanketPORelease.create({ data: { blanketPoId, releaseNumber, releaseDate: new Date(), quantity, amount } });
  }
}
