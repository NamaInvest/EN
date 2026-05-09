import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alerts = await prisma.systemAlert.findMany({
      where: {
        userId: parseInt((auth as any).id) || 1
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch system alerts' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
