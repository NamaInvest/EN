import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await (prisma as any).projectTimeEntry.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { date: 'desc' },
      take: 100
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).projectTimeEntry.create({
      data: {
        projectId: parseInt(data.projectId),
        taskId: data.taskId ? parseInt(data.taskId) : null,
        employeeId: data.employeeId ? parseInt(data.employeeId) : null,
        date: new Date(data.date),
        hours: parseFloat(data.hours),
        description: data.description || null,
        billable: data.billable !== false,
        hourlyRate: parseFloat(data.hourlyRate) || 0
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).projectTimeEntry.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/time-entries' });
  }
}
