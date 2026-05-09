import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Get full project with all relations
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
          customer: { select: { name: true } },
          tasks: true,
          budgetLines: true,
          phases: { include: { milestones: true }, orderBy: { sortOrder: 'asc' } },
          milestones: { orderBy: { dueDate: 'asc' } },
          risks: true,
          resources: { include: { employee: { select: { name: true } } } },
          timeEntries: { orderBy: { date: 'desc' }, take: 50 },
          _count: { select: { tasks: true, phases: true, milestones: true, risks: true, resources: true, timeEntries: true } }
        }
      });

      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

      // Compute analytics
      const consumedBudget = project.tasks.reduce((acc: number, t: any) => acc + t.cost, 0);
      const totalHours = project.timeEntries.reduce((acc: number, t: any) => acc + t.hours, 0);
      const billableHours = project.timeEntries.filter((t: any) => t.billable).reduce((acc: number, t: any) => acc + t.hours, 0);
      const completedTasks = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const taskProgress = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;
      const achievedMilestones = project.milestones.filter((m: any) => m.status === 'ACHIEVED').length;
      const openRisks = project.risks.filter((r: any) => r.status === 'OPEN').length;

      return NextResponse.json({
        ...project,
        analytics: {
          consumedBudget,
          remainingBudget: n(project.budget) - consumedBudget,
          budgetUtilization: n(project.budget) > 0 ? ((consumedBudget / n(project.budget)) * 100).toFixed(1) : 0,
          totalHours,
          billableHours,
          taskProgress: taskProgress.toFixed(1),
          completedTasks,
          totalTasks: project.tasks.length,
          achievedMilestones,
          totalMilestones: project.milestones.length,
          openRisks
        }
      });
    }

    // List all projects with summary
    const projects = await prisma.project.findMany({
            take: 100,
      include: {
        customer: { select: { name: true } },
        tasks: true,
        _count: { select: { tasks: true, phases: true, milestones: true, risks: true, resources: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = projects.map((p: any) => {
      const consumed = p.tasks.reduce((acc: number, t: any) => acc + t.cost, 0);
      const completed = p.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      return {
        ...p,
        consumedBudget: consumed,
        remainingBudget: n(p.budget) - consumed,
        budgetHealth: consumed > n(p.budget) ? 'danger' : consumed > n(p.budget) * 0.8 ? 'warning' : 'healthy',
        taskProgress: p.tasks.length > 0 ? ((completed / p.tasks.length) * 100).toFixed(1) : '0'
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return apiError(error, 'Error fetching project data', { context: 'projects/advanced' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
