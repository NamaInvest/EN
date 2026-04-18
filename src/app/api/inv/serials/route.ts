import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch serial numbers' }, { status: 500 });
  }
}

