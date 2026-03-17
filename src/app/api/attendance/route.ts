import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const month = searchParams.get('month');
        const where: Record<string, unknown> = {};
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (month) where.date = month; // format: 2025-03

        const records = await prisma.attendance.findMany({ where, include: { employee: true }, orderBy: { id: 'desc' }, take: 200 });
        return NextResponse.json(records);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const record = await prisma.attendance.create({
            data: {
                employeeId: parseInt(body.employeeId),
                date: body.date || new Date().toISOString().split('T')[0],
                checkIn: body.checkIn || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                checkOut: body.checkOut || null,
                notes: body.notes || null,
            },
            include: { employee: true },
        });
        return NextResponse.json(record, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const record = await prisma.attendance.update({
            where: { id: body.id },
            data: {
                checkOut: body.checkOut || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                notes: body.notes,
            },
        });
        return NextResponse.json(record);
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
