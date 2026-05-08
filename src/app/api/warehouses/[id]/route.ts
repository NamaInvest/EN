import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

  const prisma = getPrisma(request);
  try {
    const warehouse = await prisma.stock.findUnique({
      where: { id: parseInt((await params).id) },
      include: { branch: true }
    });
    
    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    
    return NextResponse.json(warehouse);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

  const prisma = getPrisma(request);
  try {
    const data = await request.json();
    
    const warehouse = await prisma.stock.update({
      where: { id: parseInt((await params).id) },
      data: {
        name: data.name,
        address: data.address,
        active: data.active,
        branchId: data.branchId ? parseInt(data.branchId) : null
      }
    });
    
    return NextResponse.json(warehouse);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const prisma = getPrisma(request);
  try {
    await prisma.stock.delete({
      where: { id: parseInt((await params).id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete warehouse or it is restricted by relationships' }, { status: 500 });
  }
}
