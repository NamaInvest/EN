import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'marketing-automation-engine' });

export class MarketingAutomationEngine {
  static async createJourney(campaignId: number, journey: object) {
    return prisma.campaignJourney.create({ data: { campaignId, journeyJson: journey } });
  }

  static async refreshSegment(tenantId: string, segmentId: number) {
    // In production: run filterJson against customer table and update estimatedSize
    const segment = await prisma.audienceSegment.findUniqueOrThrow({ where: { id: segmentId } });
    log.info(`Refreshing segment ${segmentId}: ${segment.name}`);
    return prisma.audienceSegment.update({ where: { id: segmentId }, data: { lastRefreshed: new Date() } });
  }

  static async createSegment(tenantId: string, name: string, filterJson: object) {
    return prisma.audienceSegment.create({ data: { tenantId, name, filterJson, estimatedSize: 0 } });
  }
}
