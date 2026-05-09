import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const costCenters = await prisma.costCenter.findMany({
            take: 100,
      where: {
        ...(branchId ? { branchId: parseInt(branchId) } : {}),
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(costCenters);
  } catch (error: any) {
    console.error('Error fetching Cost Centers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  code: z.any().optional(),
  nameEn: z.any().optional(),
  isActive: z.boolean().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
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
  } catch (error: any) {
    console.error('Error creating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  code: z.any().optional(),
  nameEn: z.any().optional(),
  isActive: z.boolean().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

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
  } catch (error: any) {
    console.error('Error updating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function _DELETE(request: NextRequest) {
    const prisma = getPrisma(request as any);

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
  } catch (error: any) {
    // Usually fails if it has related records (foreign key constraint)
    console.error('Error deleting Cost Center:', error);
    return NextResponse.json({ error: 'Cannot delete: Record is in use' }, { status: 400 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'FINANCIAL' });
