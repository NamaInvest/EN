import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'enterprise.fleet' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const vehicles = await prisma.vehicle.findMany({
            take: 100,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vehicles);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  plateNumber: z.any().optional(),
  make: z.any().optional(),
  model: z.any().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  status: z.any().optional(),
  currentOdometer: z.any().optional(),
  insuranceExpiry: z.any().optional(),
  licenseExpiry: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        type: data.type || 'VAN',
        status: data.status || 'AVAILABLE',
        currentOdometer: parseInt(data.currentOdometer || 0),
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      }
    });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    log.error("Vehicle Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
