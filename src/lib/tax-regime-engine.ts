import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'tax-regime-engine' });

export class TaxRegimeEngine {
  static async getTaxRate(tenantId: string, countryCode: string): Promise<number> {
    const regime = await prisma.taxRegime.findFirst({
      where: { tenantId, countryCode }
    });
    return regime ? Number(regime.taxRate) : 0;
  }
}
