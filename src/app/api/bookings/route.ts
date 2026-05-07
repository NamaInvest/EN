import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const bookings = await prisma.booking.findMany({
            take: 100, orderBy: { id: 'desc' }, include: { customer: { select: { name: true } } } });
        return NextResponse.json(bookings);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const last = await prisma.booking.findFirst({ orderBy: { bookingNo: 'desc' } });
        const bookingNo = (last?.bookingNo || 0) + 1;

        const booking = await prisma.booking.create({
            data: {
                bookingNo, customerId: body.customerId ? parseInt(body.customerId) : null,
                total: parseFloat(body.total) || 0, deposit: parseFloat(body.deposit) || 0,
                date: body.date ? new Date(body.date) : new Date(),
                status: 'pending', userId: body.userId || null, notes: body.notes || null,
            },
        });

        if (booking.deposit > 0) {
            await prisma.treasury.create({ data: { type: 'in', amount: booking.deposit, description: `عربون حجز #${bookingNo}`, referenceType: 'booking', referenceId: booking.id, userId: body.userId || null } });
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const booking = await prisma.booking.update({ where: { id: body.id }, data: { status: body.status, notes: body.notes } });
        return NextResponse.json(booking);
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
