import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const centers = await prisma.workCenter.findMany({
            take: 100,
            include: {
                machine: true,
                operations: true
            }
        });
        return NextResponse.json(centers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch work centers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { name, code, costPerHour, capacity, machineId } = body;

        const center = await prisma.workCenter.create({
            data: {
                name,
                code,
                costPerHour: parseFloat(costPerHour) || 0,
                capacity: parseFloat(capacity) || 1,
                machineId: machineId ? parseInt(machineId) : null
            }
        });

        return NextResponse.json({ message: 'تم إضافة مركز العمل بنجاح', data: center });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create work center' }, { status: 500 });
    }
}
