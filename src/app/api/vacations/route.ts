import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const vacations = await prisma.vacation.findMany({ include: { employee: { select: { id: true, name: true, position: true, department: true, phone: true } } }, orderBy: { id: 'desc' } });
        return NextResponse.json(vacations);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const vacation = await prisma.vacation.create({
            data: {
                employeeId: parseInt(body.employeeId),
                type: body.type || 'annual',
                dateFrom: body.dateFrom, dateTo: body.dateTo,
                status: body.status || 'approved',
                notes: body.notes || null,
            },
            include: { employee: { select: { id: true, name: true, position: true, department: true, phone: true } } },
        });
        return NextResponse.json(vacation, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const vacation = await prisma.vacation.update({ where: { id: body.id }, data: { status: body.status, notes: body.notes } });
        return NextResponse.json(vacation);
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
