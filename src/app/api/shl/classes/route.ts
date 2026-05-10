import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'shl.classes' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const classes = await prisma.academicClass.findMany({
            take: 100,
      include: {
        teacher: true,
        enrollments: true
      },
      orderBy: { className: 'asc' },
    });
    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch academic classes' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
