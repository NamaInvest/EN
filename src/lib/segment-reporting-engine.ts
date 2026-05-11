import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'segment-reporting-engine' });

export class SegmentReportingEngine {
  /** IFRS 8.13: 10% threshold tests */
  static async testReportability(tenantId: string, period: string) {
    log.info(`Running IFRS 8 reportability tests for ${period}`);
    const results = await prisma.segmentResult.findMany({ where: { period } });
    const totalRevenue = results.reduce((s, r) => s + Number(r.revenue), 0);
    const totalAssets  = results.reduce((s, r) => s + Number(r.assets), 0);

    return results.map(r => ({
      segmentId: r.segmentId,
      revenueTest: Number(r.revenue) >= totalRevenue * 0.1,
      assetsTest:  Number(r.assets)  >= totalAssets  * 0.1,
      isReportable: Number(r.revenue) >= totalRevenue * 0.1 || Number(r.assets) >= totalAssets * 0.1,
    }));
  }

  static async getReport(tenantId: string, period: string) {
    const segments = await prisma.operatingSegment.findMany({ where: { tenantId, isReportable: true } });
    const results  = await prisma.segmentResult.findMany({ where: { period } });
    return { segments, results };
  }
}
