import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).contractTemplate.findMany({
            take: 100,
      include: { clauses: { orderBy: { sortOrder: 'asc' } }, _count: { select: { clauses: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'contracts/templates' });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  category: z.any().optional(),
  content: z.any().optional(),
  active: z.boolean().optional(),
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
    const item = await (prisma as any).contractTemplate.create({
      data: {
        name: data.name,
        category: data.category || 'GENERAL',
        content: data.content || '',
        active: data.active !== false,
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'contracts/templates' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  category: z.any().optional(),
  content: z.any().optional(),
  active: z.boolean().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).contractTemplate.update({
      where: { id: parseInt(data.id) },
      data: { name: data.name, category: data.category, content: data.content, active: data.active }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'contracts/templates' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).contractClause.deleteMany({ where: { templateId: parseInt(id) } });
    await (prisma as any).contractTemplate.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'contracts/templates' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
