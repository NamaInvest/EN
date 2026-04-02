import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'رقم جوال ولي الأمر مطلوب' }, { status: 400 });

    const students = await prisma.student.findMany({
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
