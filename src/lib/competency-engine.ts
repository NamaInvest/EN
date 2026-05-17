import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'competency-engine' });

export class CompetencyEngine {
  static async assessEmployee(tenantId: string, employeeId: number, competencyId: number, currentLevel: number, assessedBy: number) {
    await prisma.employee.findUniqueOrThrow({ where: { id: employeeId, tenantId } } as any);
    log.info(`Competency assessment: employee ${employeeId}, competency ${competencyId}, level ${currentLevel}`);
    return prisma.employeeCompetency.create({ data: { employeeId, competencyId, currentLevel, assessedAt: new Date(), assessedBy } });
  }

  static async getGaps(tenantId: string, employeeId: number, jobId: number) {
    // In production: join JobCompetencyRequirement with EmployeeCompetency
    await prisma.employee.findUniqueOrThrow({ where: { id: employeeId, tenantId } } as any);
    const assessed = await prisma.employeeCompetency.findMany({ where: { employeeId } });
    return assessed.map(a => ({ competencyId: a.competencyId, currentLevel: a.currentLevel }));
  }

  static async getCareerPaths(tenantId: string, fromJobId: number) {
    return prisma.careerPath.findMany({ where: { fromJobId } });
  }

  static async suggestNextRole(tenantId: string, employeeId: number, currentJobId: number) {
    const paths = await this.getCareerPaths(tenantId, currentJobId);
    const gaps = await this.getGaps(tenantId, employeeId, currentJobId);
    return { possiblePaths: paths, currentGaps: gaps };
  }
}
