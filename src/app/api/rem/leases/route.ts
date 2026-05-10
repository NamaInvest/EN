import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rem.leases' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leases = await prisma.leaseContract.findMany({ take: 100,
      include: {
        tenant: true,
        unit: {
          include: {
            property: true
          }
        },
        installments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leases);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch lease contracts' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  contractNumber: z.any().optional(),
  unitId: z.union([z.string(), z.number()]).optional(),
  tenantId: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rentAmount: z.number().optional(),
  paymentFrequency: z.any().optional(),
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
    
    // Create base lease
    const contract = await prisma.leaseContract.create({
      data: {
        contractNumber: data.contractNumber,
        unitId: parseInt(data.unitId),
        tenantId: parseInt(data.tenantId),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: parseFloat(data.rentAmount),
        paymentFrequency: data.paymentFrequency || 'MONTHLY',
        status: data.status || 'ACTIVE'
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create lease contract' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
