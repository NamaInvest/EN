import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'transfer-pricing-engine' });

export class TransferPricingEngine {
  static async testTransaction(tenantId: string, tpTransactionId: number): Promise<any> {
    const tx = await prisma.tPTransaction.findFirst({ where: { id: tpTransactionId, tenantId } });
    if (!tx) throw new Error('Transaction not found');
    
    const armRange = tx.armsLengthRange as any;
    const actual = Number(tx.actualPrice);
    const withinRange = actual >= armRange.min && actual <= armRange.max;

    return prisma.tPTransaction.update({
      where: { id: tpTransactionId },
      data: { withinRange }
    });
  }
}
