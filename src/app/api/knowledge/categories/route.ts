import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).kBCategory.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { sortOrder: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'knowledge/categories' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).kBCategory.create({ data: { name: d.name, icon: d.icon || null, sortOrder: parseInt(d.sortOrder) || 0, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'knowledge/categories' }); }
}
