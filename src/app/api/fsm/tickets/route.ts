import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tickets = await prisma.serviceTicket.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customerId, description, priority, scheduledDate, technicianId } = body;

        const ticket = await prisma.serviceTicket.create({
            data: {
                ticketNo: Math.floor(Math.random() * 1000000), // Random int ticketNo
                customerId: customerId ? Number(customerId) : null,
                description,
                priority: priority || 'normal',
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                technicianId: technicianId ? Number(technicianId) : null,
                status: 'open'
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
