/**
 * WBS Service — uses actual ProjectPhase, ProjectTask, ProjectMilestone schemas
 */
import { PrismaClient } from '@prisma/client';

export interface GanttRow {
  id: number;
  name: string;
  type: 'PHASE' | 'TASK' | 'MILESTONE';
  start: Date | null;
  end: Date | null;
  progress: number;
  parentId: number | null;
  isCritical: boolean;
}

export class WBSService {
  constructor(private prisma: PrismaClient) {}

  async createMilestone(tenantId: string, projectId: number, data: {
    name: string;
    dueDate: Date;
    description?: string;
  }): Promise<number> {
    const milestone = await this.prisma.projectMilestone.create({
      data: {
        tenantId,
        projectId,
        name: data.name,
        dueDate: data.dueDate,
        description: data.description,
        status: 'PENDING',
      },
    });
    return milestone.id;
  }

  /**
   * Gantt chart using ProjectPhase, ProjectTask, ProjectMilestone
   */
  async getGanttData(tenantId: string, projectId: number): Promise<GanttRow[]> {
    const [phases, tasks, milestones] = await Promise.all([
      this.prisma.projectPhase.findMany({
        where: { tenantId, projectId },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.projectTask.findMany({
        where: { tenantId, projectId },
      }),
      this.prisma.projectMilestone.findMany({
        where: { tenantId, projectId },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const today = new Date();
    const rows: GanttRow[] = [];

    for (const phase of phases) {
      rows.push({
        id: phase.id,
        name: phase.name,
        type: 'PHASE',
        start: phase.startDate,
        end: phase.endDate,
        progress: Number(phase.progress ?? 0),
        parentId: null,
        isCritical: false,
      });
    }

    for (const task of tasks) {
      rows.push({
        id: task.id,
        name: task.name,
        type: 'TASK',
        start: null,
        end: null,
        progress: task.status === 'DONE' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0,
        parentId: null,
        isCritical: false,
      });
    }

    for (const m of milestones) {
      rows.push({
        id: m.id,
        name: `🏁 ${m.name}`,
        type: 'MILESTONE',
        start: m.dueDate,
        end: m.dueDate,
        progress: m.status === 'COMPLETED' ? 100 : 0,
        parentId: null,
        isCritical: m.dueDate < today && m.status !== 'COMPLETED',
      });
    }

    return rows;
  }

  async updateTaskStatus(tenantId: string, taskId: number, status: string): Promise<void> {
    await this.prisma.projectTask.update({ where: { id: taskId }, data: { status } });
  }

  async completeMilestone(tenantId: string, milestoneId: number): Promise<void> {
    await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { status: 'COMPLETED', completedDate: new Date() },
    });
  }

  async getProjectSummary(tenantId: string, projectId: number): Promise<{
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
    overdueMilestones: number;
    overallProgress: number;
  }> {
    const [tasks, milestones] = await Promise.all([
      this.prisma.projectTask.findMany({
        where: { tenantId, projectId },
        select: { status: true },
      }),
      this.prisma.projectMilestone.findMany({
        where: { tenantId, projectId },
        select: { status: true, dueDate: true },
      }),
    ]);

    const today = new Date();
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
    const overdueMilestones = milestones.filter(
      (m) => m.dueDate < today && m.status !== 'COMPLETED'
    ).length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalMilestones: milestones.length,
      completedMilestones,
      overdueMilestones,
      overallProgress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  }
}
