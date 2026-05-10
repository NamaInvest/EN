import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.evaluations' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const evaluations = await prisma.employeeEvaluation.findMany({
            take: 100,
      include: {
        employee: true,
        evaluator: true,
      },
      orderBy: { evaluationDate: 'desc' },
    });
    return NextResponse.json(evaluations);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch employee evaluations' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
