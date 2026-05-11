import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const log = logger.child({ service: 'nps-engine' });

export class NPSEngine {
  static async createTemplate(tenantId: string, name: string, type: 'NPS' | 'CSAT' | 'CES' | 'CUSTOM', questions: object[]) {
    return prisma.surveyTemplate.create({ data: { tenantId, name, type, questions } });
  }

  static async recordResponse(tenantId: string, templateId: number, customerId: number | undefined, answers: object, npsScore?: number, csatScore?: number) {
    if (npsScore !== undefined && (npsScore < 0 || npsScore > 10)) throw new Error('NPS score must be 0-10');
    return prisma.surveyResponse.create({ data: { tenantId, templateId, customerId, answers, npsScore, csatScore } });
  }

  /** NPS = %Promoters (9-10) - %Detractors (0-6) */
  static async calculateNPS(tenantId: string, templateId: number) {
    const responses = await prisma.surveyResponse.findMany({ where: { tenantId, templateId, npsScore: { not: null } } });
    if (!responses.length) return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    const promoters  = responses.filter(r => (r.npsScore ?? 0) >= 9).length;
    const detractors = responses.filter(r => (r.npsScore ?? 0) <= 6).length;
    const passives   = responses.length - promoters - detractors;
    const nps = Math.round(((promoters - detractors) / responses.length) * 100);
    log.info(`NPS for template ${templateId}: ${nps} (P:${promoters} N:${passives} D:${detractors})`);
    return { nps, promoters, passives, detractors, total: responses.length };
  }
}
