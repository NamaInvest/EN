import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courses = await prisma.trainingCourse.findMany({
      include: {
        enrollments: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch training courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const course = await prisma.trainingCourse.create({
      data: {
        title: data.title,
        provider: data.provider,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        cost: parseFloat(data.cost) || 0,
        status: data.status || 'SCHEDULED'
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create training course' }, { status: 500 });
  }
}

