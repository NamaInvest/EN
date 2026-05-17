import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'comp-review-engine' });

export class CompReviewEngine {
  static async initCycle(tenantId: string, name: string, fiscalYear: number, budgetPool: number) {
    return prisma.compReviewCycle.create({ data: { tenantId, name, fiscalYear, budgetPool, status: 'OPEN' } });
  }

  static async proposeIncrease(tenantId: string, cycleId: number, employeeId: number, currentSalary: number, proposedIncrease: number) {
    // Verify cycle belongs to tenant
    await prisma.compReviewCycle.findUniqueOrThrow({ where: { id: cycleId, tenantId } });
    const proposedNewSalary = currentSalary + proposedIncrease;
    log.info(`Comp proposal: employee ${employeeId}, increase ${proposedIncrease}, new salary ${proposedNewSalary}`);
    return prisma.employeeCompProposal.create({ data: { cycleId, employeeId, currentSalary, proposedIncrease, proposedNewSalary, approvalStatus: 'PENDING' } });
  }

  static async approve(tenantId: string, id: number) {
    const proposal = await prisma.employeeCompProposal.findUniqueOrThrow({ where: { id }, include: { cycle: true } } as any);
    if ((proposal as any).cycle?.tenantId !== tenantId) throw new Error("Unauthorized");
    return prisma.employeeCompProposal.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
  }

  static async getBudgetUtilization(tenantId: string, cycleId: number) {
    const cycle = await prisma.compReviewCycle.findUniqueOrThrow({ where: { id: cycleId, tenantId } });
    const proposals = await prisma.employeeCompProposal.findMany({ where: { cycleId, approvalStatus: 'APPROVED' } });
    const used = proposals.reduce((s, p) => s + Number(p.proposedIncrease), 0);
    return { budgetPool: Number(cycle.budgetPool), used, remaining: Number(cycle.budgetPool) - used };
  }
}
