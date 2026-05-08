import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rules = await prisma.commissionRule.findMany({
            take: 100,
      include: {
        payments: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch commission rules' }, { status: 500 });
  }
}

