import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alerts = await prisma.systemAlert.findMany({
      where: {
        userId: parseInt(session.user?.id as string) || 1
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system alerts' }, { status: 500 });
  }
}

