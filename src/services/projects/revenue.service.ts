/**
 * Revenue Recognition Service — IFRS 15
 * Uses actual Project schema (tasks, milestones, budgetLines)
 */
import { PrismaClient } from '@prisma/client';

export type RecognitionMethod =
  | 'PERCENTAGE_COMPLETION_COST'
  | 'PERCENTAGE_COMPLETION_EFFORT'
  | 'MILESTONE'
  | 'COMPLETED_CONTRACT';

export interface RevenueRecognitionResult {
  projectId: number;
  projectName: string;
  method: RecognitionMethod;
  contractBudget: number;
  percentComplete: number;
  recognizedToDate: number;
  previouslyRecognized: number;
  periodRecognition: number;
  journalNote: string;
}

export class ProjectRevenueService {
  constructor(private prisma: PrismaClient) {}

  async recognizeRevenue(
    tenantId: string,
    projectId: number,
    method: RecognitionMethod = 'PERCENTAGE_COMPLETION_EFFORT',
  ): Promise<RevenueRecognitionResult> {
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId, tenantId },
    });

    const [tasks, milestones, budgetLines] = await Promise.all([
      this.prisma.projectTask.findMany({ where: { projectId, tenantId }, select: { status: true } }),
      this.prisma.projectMilestone.findMany({ where: { projectId, tenantId }, select: { status: true } }),
      this.prisma.projectBudgetLine.findMany({ where: { projectId, tenantId }, select: { planned: true, actual: true } }),
    ]);

    const contractBudget = Number(project.budget ?? 0);
    let percentComplete = 0;

    switch (method) {
      case 'PERCENTAGE_COMPLETION_COST': {
        const totalPlanned = budgetLines.reduce((s, b) => s + Number(b.planned ?? 0), 0);
        const totalActual = budgetLines.reduce((s, b) => s + Number(b.actual ?? 0), 0);
        percentComplete = totalPlanned > 0 ? Math.min(totalActual / totalPlanned, 1) : 0;
        break;
      }
      case 'PERCENTAGE_COMPLETION_EFFORT': {
        const total = tasks.length || 1;
        const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
        percentComplete = done / total;
        break;
      }
      case 'MILESTONE': {
        const total = milestones.length || 1;
        const done = milestones.filter((m) => m.status === 'COMPLETED').length;
        percentComplete = done / total;
        break;
      }
      case 'COMPLETED_CONTRACT': {
        percentComplete = project.status === 'COMPLETED' ? 1 : 0;
        break;
      }
    }

    percentComplete = Math.min(1, Math.max(0, percentComplete));
    const recognizedToDate = contractBudget * percentComplete;

    // Fetch previously recognized from AuditLog
    const lastLog = await this.prisma.auditLog.findFirst({
      where: { tenantId, tableName: 'project_revenue_recognition', recordId: String(projectId), action: 'CREATE' },
      orderBy: { createdAt: 'desc' },
    });

    const previouslyRecognized = lastLog
      ? Number(JSON.parse(lastLog.details ?? '{}').recognizedToDate ?? 0)
      : 0;

    const periodRecognition = Math.max(0, recognizedToDate - previouslyRecognized);

    if (periodRecognition > 0) {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'CREATE',
          tableName: 'project_revenue_recognition',
          recordId: String(projectId),
          details: JSON.stringify({ method, percentComplete, recognizedToDate, periodRecognition, at: new Date() }),
        },
      });
    }

    return {
      projectId,
      projectName: project.name,
      method,
      contractBudget,
      percentComplete: Math.round(percentComplete * 10000) / 100,
      recognizedToDate: Math.round(recognizedToDate * 100) / 100,
      previouslyRecognized,
      periodRecognition: Math.round(periodRecognition * 100) / 100,
      journalNote: `Dr Contract Asset / Cr Revenue — ${Math.round(periodRecognition)} SAR`,
    };
  }

  async runPeriodRecognition(tenantId: string): Promise<{
    processed: number;
    totalRecognized: number;
    results: RevenueRecognitionResult[];
  }> {
    const projects = await this.prisma.project.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
      select: { id: true },
    });

    const results: RevenueRecognitionResult[] = [];
    for (const p of projects) {
      try { results.push(await this.recognizeRevenue(tenantId, p.id)); } catch { /* skip */ }
    }

    return { processed: results.length, totalRecognized: results.reduce((s, r) => s + r.periodRecognition, 0), results };
  }
}
