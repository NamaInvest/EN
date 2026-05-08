import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const students = await prisma.student.findMany({
            take: 100,
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

