import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
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

export async function PUT(request: NextRequest) {
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

export async function DELETE(request: NextRequest) {
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
