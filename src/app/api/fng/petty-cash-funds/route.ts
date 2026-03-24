import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const funds = await prisma.pettyCashFund.findMany({
      include: {
        custodian: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(funds);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch petty cash funds' }, { status: 500 });
  }
}

