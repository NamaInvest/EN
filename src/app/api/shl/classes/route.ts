import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch academic classes' }, { status: 500 });
  }
}

