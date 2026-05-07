import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee evaluations' }, { status: 500 });
  }
}

