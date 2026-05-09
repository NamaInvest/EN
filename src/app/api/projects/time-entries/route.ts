import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await (prisma as any).projectTimeEntry.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { date: 'desc' },
      take: 100
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}


const _POSTSchema = z.object({
  projectId: z.union([z.string(), z.number()]).optional(),
  taskId: z.union([z.string(), z.number()]).optional(),
  employeeId: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  hours: z.any().optional(),
  description: z.any().optional(),
  billable: z.any().optional(),
  hourlyRate: z.number().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const item = await (prisma as any).projectTimeEntry.create({
      data: {
        projectId: parseInt(data.projectId),
        taskId: data.taskId ? parseInt(data.taskId) : null,
        employeeId: data.employeeId ? parseInt(data.employeeId) : null,
        date: new Date(data.date),
        hours: parseFloat(data.hours),
        description: data.description || null,
        billable: data.billable !== false,
        hourlyRate: parseFloat(data.hourlyRate) || 0
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).projectTimeEntry.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
