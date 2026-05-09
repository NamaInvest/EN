import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const stores = await (prisma as any).storeFront.findMany({
            take: 100, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(stores);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  slug: z.any().optional(),
  domain: z.any().optional(),
  theme: z.any().optional(),
  currency: z.any().optional(),
  language: z.any().optional(),
  status: z.any().optional(),
  tenantId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  them: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const store = await (prisma as any).storeFront.create({
      data: { name: data.name, slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'), domain: data.domain || null, theme: data.theme || 'default', currency: data.currency || 'SAR', language: data.language || 'ar', status: data.status || 'ACTIVE', tenantId: data.tenantId || 'default' }
    });
    return NextResponse.json(store);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  domain: z.any().optional(),
  theme: z.any().optional(),
  status: z.any().optional(),
  settings: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const store = await (prisma as any).storeFront.update({ where: { id: parseInt(data.id) }, data: { name: data.name, domain: data.domain, theme: data.theme, status: data.status, settings: data.settings } });
    return NextResponse.json(store);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
