import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inv.serials' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serials = await prisma.productSerialNumber.findMany({
      include: {
        product: true,
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for performance
    });
    return NextResponse.json(serials);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch serial numbers' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
