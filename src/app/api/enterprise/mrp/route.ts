import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        
        // Fetch Manufacturing Orders with full tracing
        const orders = await prisma.manufacturingOrder.findMany({
            where: {
                OR: [
                    { orderNumber: { contains: search, mode: 'insensitive' } }
                ]
            },
            include: {
                recipe: {
                    include: {
                        finishedProduct: { select: { name: true, barcode: true } },
                        ingredients: { include: { rawProduct: { select: { name: true } } } }
                    }
                },
                // @ts-ignore
                machine: { select: { name: true, status: true } }
            },
            orderBy: { id: 'desc' },
        });

        // Metrics Summary
        // @ts-ignore
        const machines = await (prisma as any).machine.findMany();
        const recipes = await prisma.recipe.count();

        return NextResponse.json({ orders, machines, recipesCount: recipes });
    } catch (error: any) {
        console.error('MRP Fetch Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/mrp' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        const { type } = data; // 'order' or 'machine'

        if (type === 'machine') {
            // @ts-ignore
            const m = await (prisma as any).machine.create({
                data: { 
                    name: data.name, 
                    type: data.machineType, 
                    capacity: parseFloat(data.capacity) || 0,
                    status: 'IDLE' // IDLE, RUNNING, MAINTENANCE
                }
            });
            return NextResponse.json({ message: 'تم أرشفة محطة العمل', machine: m });
        }
        
        if (type === 'order') {
            const order = await prisma.manufacturingOrder.create({
                data: {
                    orderNumber: `MO-${Date.now()}`,
                    recipeId: parseInt(data.recipeId),
                    // @ts-ignore
                    machineId: data.machineId ? parseInt(data.machineId) : null,
                    stockId: parseInt(data.stockId),
                    quantityToProduce: parseFloat(data.quantity),
                    status: 'PLANNED',
                    startDate: data.startDate ? new Date(data.startDate) : new Date(),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    totalCost: 0 // Will be computed upon completion based on ingredients
                }
            });
            return NextResponse.json({ message: 'تم تخطيط أمر التصنيع', order });
        }

        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    } catch (error: any) {
        console.error('Create MRP Entity Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/mrp' });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { id, action } = await request.json(); // action: START, COMPLETE, SCRAP

        if (!id || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const order = await prisma.manufacturingOrder.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        let newStatus = order.status;
        if (action === 'START') newStatus = 'IN_PROGRESS';
        if (action === 'COMPLETE') newStatus = 'COMPLETED';
        if (action === 'CANCEL') newStatus = 'CANCELLED';

        const updated = await prisma.manufacturingOrder.update({
            where: { id },
            data: { status: newStatus }
        });

        // Also update machine status
        // @ts-ignore
        if (action === 'START' && order.machineId) {
            // @ts-ignore
            await (prisma as any).machine.update({ where: { id: order.machineId }, data: { status: 'RUNNING' } });
        }
        // @ts-ignore
        if (action === 'COMPLETE' && order.machineId) {
            // @ts-ignore
            await (prisma as any).machine.update({ where: { id: order.machineId }, data: { status: 'IDLE' } });
        }

        return NextResponse.json({ message: `تم تحديث حالة الأمر إلى ${newStatus}` });
    } catch (error: any) {
        console.error('Update MRP Entity Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/mrp' });
    }
}
