import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        // Fetch all work centers / machines as resources
        const machines = await prisma.machine.findMany({
            where: { status: 'active' },
            select: { id: true, name: true, code: true }
        });

        // Fetch all MOs that have start/end dates and are not cancelled
        const orders = await prisma.manufacturingOrder.findMany({
            where: {
                status: { in: ['draft', 'in_progress', 'scheduled'] },
                startDate: { not: undefined },
                endDate: { not: null }
            },
            include: { recipe: true }
        });

        return NextResponse.json({ success: true, data: { machines, orders } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { orderId, newStartDate, newEndDate, machineId } = body;

        const updated = await prisma.manufacturingOrder.update({
            where: { id: Number(orderId) },
            data: {
                startDate: new Date(newStartDate),
                endDate: new Date(newEndDate),
                machineId: machineId ? Number(machineId) : undefined
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
