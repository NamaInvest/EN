import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const scenarios = await (prisma as any).budgetScenario.findMany({
            take: 100,
      include: { lines: true, _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(scenarios);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const scenario = await (prisma as any).budgetScenario.create({
      data: {
        name: data.name,
        description: data.description || null,
        baseYear: parseInt(data.baseYear) || new Date().getFullYear(),
        growthRate: data.growthRate ? parseFloat(data.growthRate) : null,
        status: data.status || 'ACTIVE'
      }
    });
    return NextResponse.json(scenario);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}

export async function PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const scenario = await (prisma as any).budgetScenario.update({
      where: { id: parseInt(data.id) },
      data: { name: data.name, description: data.description, growthRate: data.growthRate ? parseFloat(data.growthRate) : undefined, status: data.status }
    });
    return NextResponse.json(scenario);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}

export async function DELETE(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).budgetScenarioLine.deleteMany({ where: { scenarioId: parseInt(id) } });
    await (prisma as any).budgetScenario.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'budgets/scenarios' });
  }
}
