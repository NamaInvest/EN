import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const stores = await (prisma as any).storeFront.findMany({
            take: 100, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(stores);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}

async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const store = await (prisma as any).storeFront.create({
      data: { name: data.name, slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'), domain: data.domain || null, theme: data.theme || 'default', currency: data.currency || 'SAR', language: data.language || 'ar', status: data.status || 'ACTIVE', tenantId: data.tenantId || 'default' }
    });
    return NextResponse.json(store);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}

async function _PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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
