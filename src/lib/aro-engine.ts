import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'aro-engine' });

export class AROEngine {
  /** IAS 37: Record ARO — PV = cost / (1+r)^n */
  static async record(tenantId: string, assetId: number, settlementCost: number, settlementDate: Date, discountRate: number) {
    const years = (settlementDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
    const presentValue = settlementCost / Math.pow(1 + discountRate, years);
    log.info(`Recording ARO for asset ${assetId}: PV=${presentValue.toFixed(2)}`);
    return prisma.assetRetirementObligation.create({
      data: { tenantId, assetId, estimatedSettlementCost: settlementCost, estimatedSettlementDate: settlementDate, discountRate, presentValue, status: 'ACTIVE' },
    });
  }

  /** Accretion = PV × discount rate (interest method) */
  static async accrue(aroId: number, period: Date) {
    const aro = await prisma.assetRetirementObligation.findUniqueOrThrow({ where: { id: aroId } });
    const accretionAmount = Number(aro.presentValue) * Number(aro.discountRate);
    log.info(`Accreting ARO ${aroId}: ${accretionAmount.toFixed(2)}`);
    return prisma.aROAccretion.create({ data: { aroId, period, accretionAmount } });
  }
}
