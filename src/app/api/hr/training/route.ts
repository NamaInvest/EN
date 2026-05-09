import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courses = await prisma.trainingCourse.findMany({
            take: 100,
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
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch training courses' }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  title: z.any().optional(),
  provider: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cost: z.number().optional(),
  status: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create training course' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
