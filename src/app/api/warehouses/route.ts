import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
// GET all warehouses (Stocks)
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'warehouses' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const whereClause: any = { active: true };
    if (branchId) {
        whereClause.branchId = parseInt(branchId);
    }

    const warehouses = await prisma.stock.findMany({
            take: 100,
      where: whereClause,
      include: {
        branch: true
      },
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(warehouses);
  } catch (error: any) {
    log.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

// POST: Create a new warehouse

const _POSTSchema = z.object({
  name: z.any().optional(),
  address: z.any().optional(),
  active: z.boolean().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    
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
    log.error('Error creating warehouse:', error);
    return NextResponse.json({ error: 'Failed to create warehouse', details: error.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
