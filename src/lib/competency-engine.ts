import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'competency-engine' });

export class CompetencyEngine {
  static async assessEmployee(employeeId: number, competencyId: number, currentLevel: number, assessedBy: number) {
    log.info(`Competency assessment: employee ${employeeId}, competency ${competencyId}, level ${currentLevel}`);
    return prisma.employeeCompetency.create({ data: { employeeId, competencyId, currentLevel, assessedAt: new Date(), assessedBy } });
  }

  static async getGaps(employeeId: number, jobId: number) {
    // In production: join JobCompetencyRequirement with EmployeeCompetency
    const assessed = await prisma.employeeCompetency.findMany({ where: { employeeId } });
    return assessed.map(a => ({ competencyId: a.competencyId, currentLevel: a.currentLevel }));
  }

  static async getCareerPaths(fromJobId: number) {
    return prisma.careerPath.findMany({ where: { fromJobId } });
  }

  static async suggestNextRole(employeeId: number, currentJobId: number) {
    const paths = await this.getCareerPaths(currentJobId);
    const gaps = await this.getGaps(employeeId, currentJobId);
    return { possiblePaths: paths, currentGaps: gaps };
  }
}
