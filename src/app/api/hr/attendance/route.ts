import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.attendance' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const records = await prisma.attendance.findMany({
            take: 100,
            where: { date: todayStr },
            include: { employee: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(records);
    } catch (error: any) {
        log.error("Attendance GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  action: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
    } catch (error: any) {
        log.error("Attendance POST error:", error);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
