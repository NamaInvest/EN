import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _POST(req: Request) {

    const prisma = getPrisma(req);
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'رقم جوال ولي الأمر مطلوب' }, { status: 400 });

    const students = await prisma.student.findMany({
            take: 100,
      where: { guardianPhone: phone },
      include: {
        enrollments: { include: { academicClass: true } }
      }
    });

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'لا يوجد أبناء مسجلين برقم ولي الأمر هذا' }, { status: 404 });
    }

    return NextResponse.json({ guardianPhone: phone, students });
  } catch (error: any) {
    console.error('Parent Portal Auth Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
