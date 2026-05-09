import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).kBArticle.findMany({
            take: 100, include: { category: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'knowledge/articles' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).kBArticle.create({ data: { title: d.title, content: d.content || '', categoryId: d.categoryId ? parseInt(d.categoryId) : null, tags: d.tags || null, authorId: d.authorId ? parseInt(d.authorId) : null, status: d.status || 'DRAFT', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'knowledge/articles' }); }
}
async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).kBArticle.update({ where: { id: parseInt(d.id) }, data: { title: d.title, content: d.content, tags: d.tags, status: d.status } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'knowledge/articles' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
