import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'enterprise.projects.tasks' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);


    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

        const tasks = await prisma.projectTask.findMany({ take: 100,
            where: { projectId: parseInt(projectId) },
            orderBy: { id: 'asc' },
        });

        // Calculate Project Total rollup
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { customer: { select: { name: true } } }
        });

        return NextResponse.json({ tasks, project });
    } catch (error: any) {
        log.error('Fetch Project Tasks Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  taskName: z.any().optional(),
  description: z.any().optional(),
  cost: z.number().optional(),
  actualCost: z.number().optional(),
  status: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        
        const task = await prisma.projectTask.create({
            data: {
                projectId: parseInt(data.projectId),
                name: data.name || data.taskName || '',
                description: data.description,
                cost: parseFloat(data.cost ?? data.actualCost) || 0,
                status: data.status || 'PENDING'
            }
        });

        return NextResponse.json({ message: 'تم إضافة مهمة المشروع بنجاح', task });
    } catch (error: any) {
        log.error('Create Project Task Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  cost: z.number().optional(),
  actualCost: z.number().optional(),
  status: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        
        if (!data.id) return NextResponse.json({ error: 'Task ID missing' }, { status: 400 });

        const updatedTask = await prisma.projectTask.update({
            where: { id: parseInt(data.id) },
            data: {
                cost: (data.cost ?? data.actualCost) != null ? parseFloat(data.cost ?? data.actualCost) : undefined,
                status: data.status,
            }
        });

        return NextResponse.json({ message: 'تم تحديث حالة/تكلفة المهمة', task: updatedTask });
    } catch (error: any) {
        log.error('Update Project Task Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}

async function _DELETE(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.projectTask.delete({ where: { id: parseInt(id) } });

        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error: any) {
        log.error('src/app/api/enterprise/projects/tasks/route.ts', { error: error instanceof Error ? error.message : error });

        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
