import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { Decimal } from '@prisma/client/runtime/library';

const log = logger.child({ service: 'impairment-engine' });

export class ImpairmentEngine {
  static async runTest(tenantId: string, cguId: number, testDate: Date): Promise<any> {
    const cgu = await prisma.cGU.findFirst({ where: { id: cguId, tenantId } });
    if (!cgu) throw new Error('CGU not found');

    const valueInUse = new Decimal(0); // TODO: Implement DCF
    const fairValue = new Decimal(0);  // TODO: Implement Market Approach

    const recoverableAmt = Decimal.max(valueInUse, fairValue);
    const impairmentLoss = Decimal.max(new Decimal(0), (cgu.carryingAmount as Decimal).sub(recoverableAmt));

    return prisma.impairmentTest.create({
      data: {
        tenantId,
        cguId,
        testDate,
        carryingAmount: cgu.carryingAmount,
        valueInUse,
        fairValue,
        recoverableAmt,
        impairmentLoss,
        status: 'DRAFT'
      }
    });
  }
}
