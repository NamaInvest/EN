import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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


const _PUTSchema = z.object({
  name: z.any().optional(),
  address: z.any().optional(),
  active: z.boolean().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const prisma = getPrisma(request);
  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    
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

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
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

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
