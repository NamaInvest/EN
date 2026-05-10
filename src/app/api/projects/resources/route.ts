import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'projects.resources' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await prisma.projectResource.findMany({ take: 100,
      where: { projectId: parseInt(projectId) },
      include: { employee: { select: { name: true, position: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    log.error('src/app/api/projects/resources/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'projects/resources' });
  }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  employeeId: z.union([z.string(), z.number()]).optional(),
  resourceName: z.any().optional(),
  role: z.any().optional(),
  allocation: z.any().optional(),
  hourlyRate: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const item = await prisma.projectResource.create({
      data: {
        projectId: parseInt(data.projectId),
        employeeId: data.employeeId ? parseInt(data.employeeId) : null,
        resourceName: data.resourceName || null,
        role: data.role || 'MEMBER',
        allocation: parseFloat(data.allocation) || 100,
        hourlyRate: parseFloat(data.hourlyRate) || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    log.error('src/app/api/projects/resources/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'projects/resources' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.projectResource.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('src/app/api/projects/resources/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'projects/resources' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
