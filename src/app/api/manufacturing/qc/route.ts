import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        if (type === 'maintenance') {
            const logs = await prisma.machineMaintenance.findMany({
            take: 100,
                include: { machine: true },
                orderBy: { id: 'desc' }
            });
            return NextResponse.json(logs);
        } else {
            const checks = await prisma.qualityCheck.findMany({
            take: 100,
                include: { order: { include: { recipe: true } } },
                orderBy: { id: 'desc' }
            });
            return NextResponse.json(checks);
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch QC data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    const body = await request.json();
    const { actionType } = body;

    try {
        if (actionType === 'add_qc') {
            const { orderId, inspectorName, checkType, status, notes } = body;
            const check = await prisma.qualityCheck.create({
                data: {
                    manufacturingOrderId: parseInt(orderId),
                    inspectorName,
                    checkType,
                    status,
                    notes
                }
            });
            return NextResponse.json({ message: 'تم تسجيل فحص الجودة بنجاح', data: check });
        } 
        else if (actionType === 'add_maintenance') {
            const { machineId, maintenanceType, description, cost, scheduledDate } = body;
            const log = await prisma.machineMaintenance.create({
                data: {
                    machineId: parseInt(machineId),
                    maintenanceType,
                    description,
                    cost: parseFloat(cost),
                    scheduledDate: new Date(scheduledDate)
                }
            });
            return NextResponse.json({ message: 'تم جدولة صيانة الآلة بنجاح', data: log });
        }
        
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    } catch (error) {
        console.error("QC POST error:", error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
