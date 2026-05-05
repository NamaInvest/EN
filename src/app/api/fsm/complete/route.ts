import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { ticketId, parts } = body;

        if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

        let totalPartsCost = 0;
        if (parts && parts.length > 0) {
            totalPartsCost = parts.reduce((acc: number, p: any) => acc + (Number(p.cost) * Number(p.quantity)), 0);
        }

        const ticket = await prisma.serviceTicket.update({
            where: { id: Number(ticketId) },
            data: { 
                status: 'completed', 
                completedDate: new Date(),
                partsCost: totalPartsCost
            }
        });

        return NextResponse.json({ success: true, result: ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
