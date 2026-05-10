import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'projects.phases' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const phases = await (prisma as any).projectPhase.findMany({
            take: 100,
      where: { projectId: parseInt(projectId) },
      include: { milestones: true },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(phases);
  } catch (error: any) {
    return apiError(error, 'Error fetching phases', { context: 'projects/phases' });
  }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  description: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.any().optional(),
  color: z.any().optional(),
  sortOrder: z.any().optional(),
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
    const phase = await (prisma as any).projectPhase.create({
      data: {
        projectId: parseInt(data.projectId),
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'NOT_STARTED',
        color: data.color || '#3B82F6',
        sortOrder: data.sortOrder || 0
      }
    });
    return NextResponse.json(phase);
  } catch (error: any) {
    return apiError(error, 'Error creating phase', { context: 'projects/phases' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  description: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.any().optional(),
  progress: z.any().optional(),
  color: z.any().optional(),
  sortOrder: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const phase = await (prisma as any).projectPhase.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        progress: data.progress !== undefined ? parseFloat(data.progress) : undefined,
        color: data.color,
        sortOrder: data.sortOrder
      }
    });
    return NextResponse.json(phase);
  } catch (error: any) {
    return apiError(error, 'Error updating phase', { context: 'projects/phases' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).projectPhase.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error deleting phase', { context: 'projects/phases' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
