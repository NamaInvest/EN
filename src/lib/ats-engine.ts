import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ats-engine' });

export class ATSEngine {
  static async createCandidate(tenantId: string, data: { name: string; email: string; phone?: string; resumeUrl?: string; source?: string }) {
    return prisma.candidate.create({ data: { tenantId, ...data, source: data.source ?? 'CAREER_PAGE' } });
  }

  static async applyToRequisition(tenantId: string, candidateId: number, requisitionId: number) {
    await prisma.candidate.findUniqueOrThrow({ where: { id: candidateId, tenantId } } as any);
    log.info(`Candidate ${candidateId} applying to requisition ${requisitionId}`);
    return prisma.jobApplication.create({ data: { candidateId, requisitionId, stage: 'APPLIED' } });
  }

  static async advanceStage(tenantId: string, applicationId: number, stage: string) {
    const validStages = ['APPLIED','SCREENED','INTERVIEWED','OFFERED','HIRED','REJECTED'];
    if (!validStages.includes(stage)) throw new Error(`Invalid stage: ${stage}`);
    log.info(`Application ${applicationId} → ${stage}`);
    const app = await prisma.jobApplication.findUniqueOrThrow({ where: { id: applicationId }, include: { candidate: true } } as any);
    if ((app as any).candidate?.tenantId !== tenantId) throw new Error("Unauthorized");
    return prisma.jobApplication.update({ where: { id: applicationId }, data: { stage } });
  }

  static async getPipeline(tenantId: string, requisitionId: number) {
    await prisma.jobPosting.findUniqueOrThrow({ where: { id: requisitionId, tenantId } } as any);
    const applications = await prisma.jobApplication.findMany({ where: { requisitionId } });
    const grouped: Record<string, number> = {};
    for (const app of applications) {
      grouped[app.stage] = (grouped[app.stage] || 0) + 1;
    }
    return grouped;
  }

  static async scoreResume(tenantId: string, applicationId: number, score: number) {
    const app = await prisma.jobApplication.findUniqueOrThrow({ where: { id: applicationId }, include: { candidate: true } } as any);
    if ((app as any).candidate?.tenantId !== tenantId) throw new Error("Unauthorized");
    return prisma.jobApplication.update({ where: { id: applicationId }, data: { screenScore: score } });
  }
}
