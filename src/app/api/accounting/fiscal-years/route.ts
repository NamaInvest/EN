import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const fiscalYears = await prisma.fiscalYear.findMany({
            take: 100,
            orderBy: { yearNumber: 'desc' },
            select: { id: true, yearNumber: true, startDate: true, endDate: true, status: true },
        });
        return NextResponse.json(fiscalYears);
    } catch (e: any) {
        return apiError(e, 'فشل جلب السنوات المالية', { context: 'accounting/fiscal-years' });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const { yearNumber, startDate, endDate } = body;
        if (!yearNumber || !startDate || !endDate) {
            return NextResponse.json({ error: 'yearNumber, startDate, endDate مطلوبة' }, { status: 400 });
        }
        const fy = await prisma.fiscalYear.create({
            data: {
                yearNumber: parseInt(yearNumber, 10),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: 'OPEN',
            },
        });
        return NextResponse.json(fy, { status: 201 });
    } catch (e: any) {
        return apiError(e, 'فشل إنشاء سنة مالية', { context: 'accounting/fiscal-years' });
    }
}
