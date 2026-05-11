import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'contract-asset-engine' });

/**
 * F-05: IFRS 15 Contract Assets / Liabilities
 * - Contract Asset: rights to consideration not yet billed
 * - Contract Liability (Deferred Revenue): received before performance
 */
export class ContractAssetEngine {
  /** Step 1: Identify performance obligations per contract */
  static async allocateTransactionPrice(contractId: number, obligations: Array<{ code: string; ssp: number }>) {
    const totalSSP = obligations.reduce((s, o) => s + o.ssp, 0);
    return obligations.map(o => ({
      code: o.code,
      allocated: (o.ssp / totalSSP),
      allocationPct: ((o.ssp / totalSSP) * 100).toFixed(2) + '%',
    }));
  }

  /** Step 2: Recognize revenue when / as performance obligation satisfied */
  static async recognizeRevenue(contractId: number, obligationCode: string, percentComplete: number, totalPrice: number) {
    const recognized = totalPrice * percentComplete;
    log.info(`IFRS 15: Contract ${contractId} obligation ${obligationCode} → ${(percentComplete * 100).toFixed(0)}% complete, recognized: ${recognized}`);
    return { contractId, obligationCode, recognized, unrecognized: totalPrice - recognized };
  }

  /** Step 3: Build contract asset / liability position */
  static buildPosition(billedToDate: number, revenueRecognized: number) {
    const diff = revenueRecognized - billedToDate;
    return {
      contractAsset: diff > 0 ? diff : 0,      // Unbilled AR
      contractLiability: diff < 0 ? -diff : 0, // Deferred revenue
    };
  }
}
