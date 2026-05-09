import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const scenarios = await (prisma as any).budgetScenario.findMany({
            take: 100,
      include: { lines: true, _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(scenarios);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  description: z.any().optional(),
  baseYear: z.union([z.string(), z.number()]).optional(),
  growthRate: z.number().optional(),
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
    const scenario = await (prisma as any).budgetScenario.create({
      data: {
        name: data.name,
        description: data.description || null,
        baseYear: parseInt(data.baseYear) || new Date().getFullYear(),
        growthRate: data.growthRate ? parseFloat(data.growthRate) : null,
        status: data.status || 'ACTIVE'
      }
    });
    return NextResponse.json(scenario);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  description: z.any().optional(),
  growthRate: z.number().optional(),
  status: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const scenario = await (prisma as any).budgetScenario.update({
      where: { id: parseInt(data.id) },
      data: { name: data.name, description: data.description, growthRate: data.growthRate ? parseFloat(data.growthRate) : undefined, status: data.status }
    });
    return NextResponse.json(scenario);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).budgetScenarioLine.deleteMany({ where: { scenarioId: parseInt(id) } });
    await (prisma as any).budgetScenario.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
