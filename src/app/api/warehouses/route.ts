import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
// GET all warehouses (Stocks)
import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

// POST: Create a new warehouse
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
