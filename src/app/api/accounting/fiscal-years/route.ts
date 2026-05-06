import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const fiscalYears = await prisma.fiscalYear.findMany({
            orderBy: { yearNumber: 'desc' },
            select: { id: true, yearNumber: true, startDate: true, endDate: true, status: true },
        });
        return NextResponse.json(fiscalYears);
    } catch (e) {
        return apiError(e, 'فشل جلب السنوات المالية', { context: 'accounting/fiscal-years' });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
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
    } catch (e) {
        return apiError(e, 'فشل إنشاء سنة مالية', { context: 'accounting/fiscal-years' });
    }
}
