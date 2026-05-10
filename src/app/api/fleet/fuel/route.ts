import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fleet.fuel' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fuels = await prisma.fuelLog.findMany({ take: 100,
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(fuels);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch fuel logs' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  vehicleId: z.union([z.string(), z.number()]).optional(),
  driverId: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  liters: z.any().optional(),
  cost: z.number().optional(),
  odometerReading: z.any().optional(),
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
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: parseInt(data.vehicleId),
        driverId: parseInt(data.driverId),
        date: new Date(data.date),
        liters: parseFloat(data.liters),
        cost: parseFloat(data.cost),
        odometerReading: parseInt(data.odometerReading),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to log fuel' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
