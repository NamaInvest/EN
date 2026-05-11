import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customer-health-engine' });

interface HealthFactors {
  recencyScore: number;   // 0-25
  frequencyScore: number; // 0-25
  monetaryScore: number;  // 0-25
  supportScore: number;   // 0-25
  [key: string]: unknown; // Prisma Json compatibility
}

export class CustomerHealthEngine {
  static computeScore(factors: HealthFactors): number {
    return factors.recencyScore + factors.frequencyScore + factors.monetaryScore + factors.supportScore;
  }

  static getChurnRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 70) return 'LOW';
    if (score >= 40) return 'MEDIUM';
    return 'HIGH';
  }

  static async upsertHealth(tenantId: string, customerId: number, factors: HealthFactors) {
    const score = this.computeScore(factors);
    const churnRisk = this.getChurnRisk(score);
    log.info(`Customer ${customerId} health: ${score}/100, risk: ${churnRisk}`);
    return prisma.customerHealth.create({ data: { tenantId, customerId, score, churnRisk, factors: factors as unknown as Prisma.InputJsonValue } });
  }

  static async getAtRisk(tenantId: string, threshold = 40) {
    return prisma.customerHealth.findMany({ where: { tenantId, score: { lt: threshold } }, orderBy: { score: 'asc' } });
  }
}
