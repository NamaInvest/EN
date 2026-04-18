import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alerts = await prisma.systemAlert.findMany({
      where: {
        userId: parseInt((auth as any).id) || 1
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system alerts' }, { status: 500 });
  }
}

