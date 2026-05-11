import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vendor-onboarding-engine' });

export class VendorOnboardingEngine {
  static async initiate(tenantId: string, applicationData: object) {
    log.info(`Initiating vendor onboarding for tenant ${tenantId}`);
    return prisma.vendorOnboarding.create({
      data: { tenantId, applicationData, status: 'PENDING', currentStage: 'INITIAL' },
    });
  }

  static async advanceStage(id: number, stage: string, updates: object = {}) {
    log.info(`Advancing onboarding ${id} to stage ${stage}`);
    return prisma.vendorOnboarding.update({ where: { id }, data: { currentStage: stage, ...updates } });
  }

  /** Mod-97 IBAN validation (ISO 13616) */
  static validateIBAN(iban: string): boolean {
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged.split('').map(c => isNaN(Number(c)) ? (c.charCodeAt(0) - 55).toString() : c).join('');
    let remainder = 0;
    for (const chunk of numeric.match(/.{1,9}/g) || []) {
      remainder = Number(String(remainder) + chunk) % 97;
    }
    return remainder === 1;
  }
}
