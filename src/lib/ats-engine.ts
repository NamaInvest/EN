import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ats-engine' });

export class ATSEngine {
  static async createCandidate(tenantId: string, data: { name: string; email: string; phone?: string; resumeUrl?: string; source?: string }) {
    return prisma.candidate.create({ data: { tenantId, ...data, source: data.source ?? 'CAREER_PAGE' } });
  }

  static async applyToRequisition(candidateId: number, requisitionId: number) {
    log.info(`Candidate ${candidateId} applying to requisition ${requisitionId}`);
    return prisma.jobApplication.create({ data: { candidateId, requisitionId, stage: 'APPLIED' } });
  }

  static async advanceStage(applicationId: number, stage: string) {
    const validStages = ['APPLIED','SCREENED','INTERVIEWED','OFFERED','HIRED','REJECTED'];
    if (!validStages.includes(stage)) throw new Error(`Invalid stage: ${stage}`);
    log.info(`Application ${applicationId} → ${stage}`);
    return prisma.jobApplication.update({ where: { id: applicationId }, data: { stage } });
  }

  static async getPipeline(tenantId: string, requisitionId: number) {
    const applications = await prisma.jobApplication.findMany({ where: { requisitionId } });
    const grouped: Record<string, number> = {};
    for (const app of applications) {
      grouped[app.stage] = (grouped[app.stage] || 0) + 1;
    }
    return grouped;
  }

  static async scoreResume(applicationId: number, score: number) {
    return prisma.jobApplication.update({ where: { id: applicationId }, data: { screenScore: score } });
  }
}
