import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await prisma.stock.delete({
      where: { id: parseInt((await params).id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete warehouse or it is restricted by relationships' }, { status: 500 });
  }
}
