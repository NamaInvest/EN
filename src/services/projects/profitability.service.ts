/**
 * Project Profitability Service
 * Uses actual schema: ProjectBudgetLine.planned/actual, ProjectTask.status
 */
import { PrismaClient } from '@prisma/client';

export interface ProjectPL {
  projectId: number;
  projectName: string;
  budget: number;
  plannedCost: number;
  actualCost: number;
  plannedVariance: number;
  taskCompletion: number;
  budgetUtilization: number;
}

export class ProjectProfitabilityService {
  constructor(private prisma: PrismaClient) {}

  async analyzeMargin(tenantId: string, projectId: number): Promise<ProjectPL> {
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId, tenantId },
    });

    const [tasks, budgetLines] = await Promise.all([
      this.prisma.projectTask.findMany({
        where: { projectId, tenantId },
        select: { status: true },
      }),
      this.prisma.projectBudgetLine.findMany({
        where: { projectId, tenantId },
        select: { planned: true, actual: true },
      }),
    ]);

    const budget = Number(project.budget ?? 0);
    const plannedCost = budgetLines.reduce((s, b) => s + Number(b.planned ?? 0), 0);
    const actualCost = budgetLines.reduce((s, b) => s + Number(b.actual ?? 0), 0);

    const totalTasks = tasks.length || 1;
    const doneTasks = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;

    return {
      projectId,
      projectName: project.name,
      budget,
      plannedCost,
      actualCost: Math.round(actualCost * 100) / 100,
      plannedVariance: Math.round((plannedCost - actualCost) * 100) / 100,
      taskCompletion: Math.round((doneTasks / totalTasks) * 10000) / 100,
      budgetUtilization: budget > 0 ? Math.round((actualCost / budget) * 10000) / 100 : 0,
    };
  }

  async getPortfolioSummary(tenantId: string, status?: string): Promise<{
    projects: ProjectPL[];
    totalBudget: number;
    totalActualCost: number;
    avgUtilization: number;
  }> {
    const projects = await this.prisma.project.findMany({
      where: { tenantId, status: status ?? undefined },
      select: { id: true },
    });

    const pls: ProjectPL[] = [];
    for (const p of projects) {
      try {
        pls.push(await this.analyzeMargin(tenantId, p.id));
      } catch { /* skip */ }
    }

    const totalBudget = pls.reduce((s, p) => s + p.budget, 0);
    const totalActualCost = pls.reduce((s, p) => s + p.actualCost, 0);
    const avgUtilization = pls.length > 0
      ? pls.reduce((s, p) => s + p.budgetUtilization, 0) / pls.length
      : 0;

    return { projects: pls, totalBudget, totalActualCost, avgUtilization };
  }
}
