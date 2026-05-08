import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const items = await prisma.projectMilestone.findMany({
            take: 100,
      where: { projectId: parseInt(projectId) },
      include: { phase: { select: { name: true, color: true } } },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectMilestone.create({
      data: {
        projectId: parseInt(data.projectId),
        phaseId: data.phaseId ? parseInt(data.phaseId) : null,
        name: data.name,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        status: data.status || 'PENDING'
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}

export async function PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await prisma.projectMilestone.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
        status: data.status,
        phaseId: data.phaseId ? parseInt(data.phaseId) : undefined
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}

export async function DELETE(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.projectMilestone.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'projects/milestones' });
  }
}
