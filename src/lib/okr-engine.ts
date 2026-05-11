import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'okr-engine' });

export class OKREngine {
  static async createObjective(tenantId: string, ownerEmpId: number, title: string, period: string, level: string, parentObjectiveId?: number) {
    return prisma.objective.create({ data: { tenantId, ownerEmpId, title, period, level, parentObjectiveId } });
  }

  static async addKeyResult(objectiveId: number, title: string, targetValue: number) {
    return prisma.keyResult.create({ data: { objectiveId, title, targetValue, currentValue: 0, confidence: 3 } });
  }

  static async updateProgress(keyResultId: number, currentValue: number, confidence: 1|2|3|4|5) {
    log.info(`KR ${keyResultId} updated: value=${currentValue}, confidence=${confidence}`);
    return prisma.keyResult.update({ where: { id: keyResultId }, data: { currentValue, confidence } });
  }

  static async getProgress(tenantId: string, period: string) {
    const objectives = await prisma.objective.findMany({ where: { tenantId, period } });
    const results = await Promise.all(objectives.map(async o => {
      const krs = await prisma.keyResult.findMany({ where: { objectiveId: o.id } });
      const completion = krs.length ? krs.reduce((s, kr) => s + (Number(kr.currentValue) / Number(kr.targetValue)), 0) / krs.length : 0;
      return { objective: o, keyResults: krs, completion: Math.min(completion, 1) };
    }));
    return results;
  }
}
