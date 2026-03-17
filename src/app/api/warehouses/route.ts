import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all warehouses (Stocks)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const whereClause: any = { active: true };
    if (branchId) {
        whereClause.branchId = parseInt(branchId);
    }

    const warehouses = await prisma.stock.findMany({
      where: whereClause,
      include: {
        branch: true
      },
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

// POST: Create a new warehouse
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const warehouse = await prisma.stock.create({
      data: {
        name: data.name,
        address: data.address || null,
        active: data.active !== undefined ? data.active : true,
        branchId: data.branchId ? parseInt(data.branchId) : null
      }
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: 'Failed to create warehouse', details: error.message }, { status: 500 });
  }
}
