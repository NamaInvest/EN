import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).slaPolicy.findMany({
            take: 100,
      orderBy: { priority: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).slaPolicy.create({
      data: {
        name: data.name,
        priority: data.priority || 'MEDIUM',
        responseHours: parseInt(data.responseHours) || 4,
        resolutionHours: parseInt(data.resolutionHours) || 24,
        escalationHours: data.escalationHours ? parseInt(data.escalationHours) : null,
        active: data.active !== false
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}

export async function PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).slaPolicy.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        priority: data.priority,
        responseHours: data.responseHours ? parseInt(data.responseHours) : undefined,
        resolutionHours: data.resolutionHours ? parseInt(data.resolutionHours) : undefined,
        escalationHours: data.escalationHours ? parseInt(data.escalationHours) : undefined,
        active: data.active
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}
