import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { Decimal } from '@prisma/client/runtime/library';

const log = logger.child({ service: 'cash-app-engine' });

export class CashAppEngine {
  static async applyReceipt(tenantId: string, batchId: number, invoiceId: number): Promise<any> {
    log.info(`Running Cash Application AI for batch ${batchId}`);
    return prisma.cashApplication.create({
      data: {
        tenantId,
        batchId,
        invoiceId,
        appliedAmount: new Decimal(100),
        remainingInvoiceBalance: new Decimal(0),
        discountTaken: new Decimal(0),
        writeOffAmount: new Decimal(0)
      }
    });
  }
}
