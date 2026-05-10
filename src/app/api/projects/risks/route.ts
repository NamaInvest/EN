import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'projects.risks' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await prisma.projectRisk.findMany({
            take: 100,
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  title: z.any().optional(),
  description: z.any().optional(),
  probability: z.any().optional(),
  impact: z.any().optional(),
  mitigationPlan: z.any().optional(),
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
    const item = await prisma.projectRisk.create({
      data: {
        projectId: parseInt(data.projectId),
        title: data.title,
        description: data.description || null,
        probability: data.probability || 'MEDIUM',
        impact: data.impact || 'MEDIUM',
        mitigationPlan: data.mitigationPlan || null,
        status: data.status || 'OPEN'
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.any().optional(),
  description: z.any().optional(),
  probability: z.any().optional(),
  impact: z.any().optional(),
  mitigationPlan: z.any().optional(),
  status: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectRisk.update({
      where: { id: parseInt(data.id) },
      data: { title: data.title, description: data.description, probability: data.probability, impact: data.impact, mitigationPlan: data.mitigationPlan, status: data.status }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.projectRisk.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
