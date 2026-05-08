import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const installments = await prisma.rentInstallment.findMany({
            take: 100,
      include: {
        contract: {
          include: { tenant: true, unit: true }
        }
      },
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json(installments);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch rent installments' }, { status: 500 });
  }
}

