import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const phases = await (prisma as any).projectPhase.findMany({
      where: { projectId: parseInt(projectId) },
      include: { milestones: true },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(phases);
  } catch (error: any) {
    return apiError(error, 'Error fetching phases', { context: 'projects/phases' });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const phase = await (prisma as any).projectPhase.create({
      data: {
        projectId: parseInt(data.projectId),
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'NOT_STARTED',
        color: data.color || '#3B82F6',
        sortOrder: data.sortOrder || 0
      }
    });
    return NextResponse.json(phase);
  } catch (error: any) {
    return apiError(error, 'Error creating phase', { context: 'projects/phases' });
  }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const phase = await (prisma as any).projectPhase.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        progress: data.progress !== undefined ? parseFloat(data.progress) : undefined,
        color: data.color,
        sortOrder: data.sortOrder
      }
    });
    return NextResponse.json(phase);
  } catch (error: any) {
    return apiError(error, 'Error updating phase', { context: 'projects/phases' });
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).projectPhase.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error deleting phase', { context: 'projects/phases' });
  }
}
