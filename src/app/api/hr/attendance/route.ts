import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const records = await prisma.attendance.findMany({
            where: { date: todayStr },
            include: { employee: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(records);
    } catch (error) {
        console.error("Attendance GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { employeeId, action } = body;

        if (!employeeId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().split(' ')[0].slice(0, 5); // HH:MM

        let record = await prisma.attendance.findFirst({
            where: { employeeId: parseInt(employeeId), date: todayStr }
        });

        if (action === 'check-in') {
            if (record && record.checkIn) {
                return NextResponse.json({ error: 'تم تسجيل الدخول مسبقاً اليوم' }, { status: 400 });
            }
            if (!record) {
                record = await prisma.attendance.create({
                    data: {
                        employeeId: parseInt(employeeId),
                        date: todayStr,
                        checkIn: nowTime
                    }
                });
            } else {
                record = await prisma.attendance.update({
                    where: { id: record.id },
                    data: { checkIn: nowTime }
                });
            }
        } else if (action === 'check-out') {
            if (!record || !record.checkIn) {
                return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 400 });
            }
            if (record.checkOut) {
                return NextResponse.json({ error: 'تم تسجيل الانصراف مسبقاً اليوم' }, { status: 400 });
            }
            record = await prisma.attendance.update({
                where: { id: record.id },
                data: { checkOut: nowTime }
            });
        }

        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error("Attendance POST error:", error);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}
