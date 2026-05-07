import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const stores = await (prisma as any).storeFront.findMany({
            take: 100, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(stores);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const store = await (prisma as any).storeFront.create({
      data: { name: data.name, slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'), domain: data.domain || null, theme: data.theme || 'default', currency: data.currency || 'SAR', language: data.language || 'ar', status: data.status || 'ACTIVE', tenantId: data.tenantId || 'default' }
    });
    return NextResponse.json(store);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const store = await (prisma as any).storeFront.update({ where: { id: parseInt(data.id) }, data: { name: data.name, domain: data.domain, theme: data.theme, status: data.status, settings: data.settings } });
    return NextResponse.json(store);
  } catch (error: any) { return apiError(error, 'Error', { context: 'ecommerce/stores' }); }
}
