import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const prisma = getPrisma(request);
  try {
    await prisma.stock.delete({
      where: { id: parseInt((await params).id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete warehouse or it is restricted by relationships' }, { status: 500 });
  }
}
