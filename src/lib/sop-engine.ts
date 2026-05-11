import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sop-engine' });

const STAGES = ['STAGE1_PRODUCT_REVIEW','STAGE2_DEMAND_REVIEW','STAGE3_SUPPLY_REVIEW','STAGE4_PRE_SOP','STAGE5_EXECUTIVE_SOP','FINALIZED'];

export class SOPEngine {
  static async initCycle(tenantId: string, cycleMonth: Date) {
    log.info(`Initiating S&OP cycle for ${cycleMonth.toISOString().slice(0, 7)}`);
    return prisma.sopCycle.create({ data: { tenantId, cycleMonth, status: 'STAGE1_PRODUCT_REVIEW' } });
  }

  static async advanceStage(id: number) {
    const cycle = await prisma.sopCycle.findUniqueOrThrow({ where: { id } });
    const idx = STAGES.indexOf(cycle.status);
    if (idx === -1 || idx === STAGES.length - 1) throw new Error('Already finalized');
    const nextStage = STAGES[idx + 1];
    log.info(`S&OP cycle ${id} → ${nextStage}`);
    return prisma.sopCycle.update({ where: { id }, data: { status: nextStage } });
  }

  static async saveStageOutput(id: number, outputs: object) {
    return prisma.sopCycle.update({ where: { id }, data: { stageOutputs: outputs } });
  }

  static async saveExecutiveDecisions(id: number, decisions: object) {
    return prisma.sopCycle.update({ where: { id }, data: { executiveDecisions: decisions } });
  }
}
