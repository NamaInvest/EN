import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await prisma.projectRisk.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectRisk.create({
      data: {
        projectId: parseInt(data.projectId),
        title: data.title,
        description: data.description || null,
        probability: data.probability || 'MEDIUM',
        impact: data.impact || 'MEDIUM',
        mitigationPlan: data.mitigationPlan || null,
        status: data.status || 'OPEN'
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectRisk.update({
      where: { id: parseInt(data.id) },
      data: { title: data.title, description: data.description, probability: data.probability, impact: data.impact, mitigationPlan: data.mitigationPlan, status: data.status }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.projectRisk.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/risks' });
  }
}
