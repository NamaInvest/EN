import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const properties = await prisma.property.findMany({
            take: 100,
      include: {
        units: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(properties);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  type: z.any().optional(),
  address: z.any().optional(),
  totalUnits: z.number().optional(),
  status: z.any().optional(),
  areaSqm: z.any().optional(),
  rentYearly: z.union([z.string(), z.number()]).optional(),
  unitType: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

  try {
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const property = await prisma.property.create({
      data: {
        name: data.name,
        type: data.type || 'COMMERCIAL_BUILDING',
        address: data.address || '',
        totalUnits: parseInt(data.totalUnits || 1),
        status: data.status || 'ACTIVE',
      }
    });

    // Auto-generate units based on totalUnits count
    const unitSqm = parseFloat(data.areaSqm || 100);
    const unitRent = parseFloat(data.rentYearly || 0);
    
    const unitsData = Array.from({ length: property.totalUnits }).map((_, i) => ({
      propertyId: property.id,
      unitNumber: `${data.name.substring(0,3).toUpperCase()}-${(i+1).toString().padStart(3, '0')}`,
      type: data.unitType || 'OFFICE',
      floor: Math.ceil((i+1) / 4) || 1, // Rough estimate of 4 units per floor
      areaSqm: unitSqm,
      rentYearly: unitRent,
      status: 'VACANT'
    }));

    if(unitsData.length > 0) {
        await prisma.propertyUnit.createMany({
            data: unitsData
        });
    }

    const createdProperty = await prisma.property.findUnique({
        where: { id: property.id },
        include: { units: true }
    });

    return NextResponse.json(createdProperty);
  } catch (error: any) {
    console.error("Property Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
