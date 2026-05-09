import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await prisma.projectMilestone.findMany({
            take: 100,
      where: { projectId: parseInt(projectId) },
      include: { phase: { select: { name: true, color: true } } },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  phaseId: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  description: z.any().optional(),
  dueDate: z.string().optional(),
  status: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
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
    const item = await prisma.projectMilestone.create({
      data: {
        projectId: parseInt(data.projectId),
        phaseId: data.phaseId ? parseInt(data.phaseId) : null,
        name: data.name,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        status: data.status || 'PENDING'
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  description: z.any().optional(),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  status: z.any().optional(),
  phaseId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectMilestone.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
        status: data.status,
        phaseId: data.phaseId ? parseInt(data.phaseId) : undefined
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.projectMilestone.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
