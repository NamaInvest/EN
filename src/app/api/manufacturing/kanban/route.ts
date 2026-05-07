import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    
    try {
        // 1. Kanban Data (Work Orders grouped by status)
        const orders = await prisma.manufacturingOrder.findMany({
            take: 100,
            include: { recipe: { include: { finishedProduct: true } }, machine: true },
            orderBy: { id: 'desc' }
        });

        const kanban = {
            todo: orders.filter(o => o.status === 'draft'),
            inProgress: orders.filter(o => o.status === 'in_progress'),
            done: orders.filter(o => o.status === 'completed')
        };

        // 2. Traceability Logs
        const traceability = await (prisma as any).traceabilityLog.findMany({
            orderBy: { id: 'desc' },
            take: 20
        });

        // 3. IoT Telemetry (Simulated or Real if available)
        const telemetry = await (prisma as any).machineTelemetry.findMany({
            include: { machine: true },
            orderBy: { id: 'desc' },
            take: 10
        });

        return NextResponse.json({ kanban, traceability, telemetry });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch Kanban data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    const body = await request.json();
    const { actionType, orderId, newStatus, rawBatchId, finishedBatchId } = body;

    try {
        if (actionType === 'update_status') {
            await prisma.manufacturingOrder.update({
                where: { id: parseInt(orderId) },
                data: { status: newStatus }
            });
            return NextResponse.json({ message: 'تم تحديث حالة Kanban' });
        }
        else if (actionType === 'add_traceability') {
            await (prisma as any).traceabilityLog.create({
                data: {
                    orderId: parseInt(orderId),
                    rawBatchId: rawBatchId ? parseInt(rawBatchId) : null,
                    finishedBatchId: finishedBatchId ? parseInt(finishedBatchId) : null,
                    action: 'produced'
                }
            });
            return NextResponse.json({ message: 'تم تسجيل التتبع (Traceability)' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
