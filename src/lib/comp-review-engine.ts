import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'comp-review-engine' });

export class CompReviewEngine {
  static async initCycle(tenantId: string, name: string, fiscalYear: number, budgetPool: number) {
    return prisma.compReviewCycle.create({ data: { tenantId, name, fiscalYear, budgetPool, status: 'OPEN' } });
  }

  static async proposeIncrease(cycleId: number, employeeId: number, currentSalary: number, proposedIncrease: number) {
    const proposedNewSalary = currentSalary + proposedIncrease;
    log.info(`Comp proposal: employee ${employeeId}, increase ${proposedIncrease}, new salary ${proposedNewSalary}`);
    return prisma.employeeCompProposal.create({ data: { cycleId, employeeId, currentSalary, proposedIncrease, proposedNewSalary, approvalStatus: 'PENDING' } });
  }

  static async approve(id: number) {
    return prisma.employeeCompProposal.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
  }

  static async getBudgetUtilization(cycleId: number) {
    const cycle = await prisma.compReviewCycle.findUniqueOrThrow({ where: { id: cycleId } });
    const proposals = await prisma.employeeCompProposal.findMany({ where: { cycleId, approvalStatus: 'APPROVED' } });
    const used = proposals.reduce((s, p) => s + Number(p.proposedIncrease), 0);
    return { budgetPool: Number(cycle.budgetPool), used, remaining: Number(cycle.budgetPool) - used };
  }
}
