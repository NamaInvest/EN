import { logger } from '@/lib/logger';

const log = logger.child({ service: 'spend-analytics-engine' });

export class SpendAnalyticsEngine {
  static async classify(prisma: any, tenantId: string, transactionType: string, transactionId: number, description: string, categoryId: number) {
    log.info(`Classifying ${transactionType}#${transactionId}`);
    return prisma.spendClassification.create({
      data: { tenantId, transactionType, transactionId, categoryId, classifiedBy: 'RULE', confidence: 0.9 },
    });
  }

  static async buildCube(prisma: any, tenantId: string) {
    const classifications = await prisma.spendClassification.findMany({ where: { tenantId } });
    const byCategory = new Map<number, number>();
    classifications.forEach((c: any) => {
      byCategory.set(c.categoryId, (byCategory.get(c.categoryId) || 0) + 1);
    });
    return Array.from(byCategory.entries()).map(([categoryId, count]) => ({ categoryId, count }));
  }
}
