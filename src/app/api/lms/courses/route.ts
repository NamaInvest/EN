import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).lmsCourse.findMany({ include: { _count: { select: { modules: true, enrollments: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'lms/courses' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).lmsCourse.create({ data: { title: d.title, description: d.description, category: d.category, instructor: d.instructor, duration: parseInt(d.duration) || 0, level: d.level || 'BEGINNER', published: d.published || false, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'lms/courses' }); }
}
