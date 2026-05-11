import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'succession-engine' });

const NINE_BOX = [
  { perf: 1, pot: 1, box: 1, label: 'Poor Performer / Low Potential' },
  { perf: 1, pot: 2, box: 2, label: 'Poor Performer / Moderate Potential' },
  { perf: 1, pot: 3, box: 3, label: 'Poor Performer / High Potential' },
  { perf: 2, pot: 1, box: 4, label: 'Moderate Performer / Low Potential' },
  { perf: 2, pot: 2, box: 5, label: 'Core Performer' },
  { perf: 2, pot: 3, box: 6, label: 'High Potential' },
  { perf: 3, pot: 1, box: 7, label: 'Star Performer / Low Potential' },
  { perf: 3, pot: 2, box: 8, label: 'High Performer / Moderate Potential' },
  { perf: 3, pot: 3, box: 9, label: 'Top Talent' },
];

export class SuccessionEngine {
  static getBox(performance: 1|2|3, potential: 1|2|3) {
    return NINE_BOX.find(n => n.perf === performance && n.pot === potential)!;
  }

  static async rateEmployee(tenantId: string, employeeId: number, reviewCycle: string, performance: 1|2|3, potential: 1|2|3) {
    const { box } = this.getBox(performance, potential);
    log.info(`9-box rating: employee ${employeeId} → box ${box}`);
    return prisma.nineBoxRating.create({ data: { tenantId, employeeId, reviewCycle, performance, potential, box } });
  }

  static async identifySuccessors(planId: number) {
    return prisma.successionCandidate.findMany({ where: { planId }, orderBy: { readiness: 'asc' } });
  }

  static async addCandidate(planId: number, employeeId: number, readiness: string, gaps: object) {
    return prisma.successionCandidate.create({ data: { planId, employeeId, readiness, gaps } });
  }
}
