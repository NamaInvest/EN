import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const trips = await prisma.fleetTrip.findMany({
            take: 100,
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { departureTime: 'desc' }
    });
    return NextResponse.json(trips);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch fleet trips' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  vehicleId: z.union([z.string(), z.number()]).optional(),
  driverId: z.union([z.string(), z.number()]).optional(),
  departureTime: z.any().optional(),
  arrivalTime: z.any().optional(),
  startLocation: z.any().optional(),
  endLocation: z.any().optional(),
  distanceKm: z.any().optional(),
  notes: z.any().optional(),
  status: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const trip = await prisma.fleetTrip.create({
      data: {
        vehicleId: parseInt(data.vehicleId),
        driverId: parseInt(data.driverId),
        departureTime: new Date(data.departureTime),
        arrivalTime: data.arrivalTime ? new Date(data.arrivalTime) : null,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        distanceKm: parseFloat(data.distanceKm) || 0,
        notes: data.notes || '',
        status: data.status || 'IN_PROGRESS'
      }
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create fleet trip' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
