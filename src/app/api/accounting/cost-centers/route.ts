import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth'; // Adjust based on your auth pattern

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const costCenters = await prisma.costCenter.findMany({
      where: {
        ...(branchId ? { branchId: parseInt(branchId) } : {}),
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error('Error fetching Cost Centers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, code, nameEn, isActive, branchId } = data;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    // Check code uniqueness
    const existing = await prisma.costCenter.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Cost Center code already exists' }, { status: 400 });
    }

    const newCostCenter = await prisma.costCenter.create({
      data: {
        name,
        code,
        nameEn: nameEn || null,
        isActive: isActive !== undefined ? isActive : true,
        branchId: branchId ? parseInt(branchId) : null,
      },
    });

    return NextResponse.json(newCostCenter, { status: 201 });
  } catch (error) {
    console.error('Error creating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, code, nameEn, isActive, branchId } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updated = await prisma.costCenter.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        nameEn,
        isActive,
        branchId: branchId ? parseInt(branchId) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.costCenter.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Usually fails if it has related records (foreign key constraint)
    console.error('Error deleting Cost Center:', error);
    return NextResponse.json({ error: 'Cannot delete: Record is in use' }, { status: 400 });
  }
}
