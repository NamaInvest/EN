import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
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
                        product: { select: { name: true, code: true } },
                        ingredients: { include: { product: { select: { name: true } } } }
                    }
                },
                machine: { select: { name: true, status: true } },
                stock: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Metrics Summary
        const machines = await prisma.machine.findMany();
        const recipes = await prisma.recipe.count();

        return NextResponse.json({ orders, machines, recipesCount: recipes });
    } catch (error: any) {
        console.error('MRP Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { type } = data; // 'order' or 'machine'

        if (type === 'machine') {
            const m = await prisma.machine.create({
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
            // Need Recipe, Quantity, Expected Date, Machine
            const order = await prisma.manufacturingOrder.create({
                data: {
                    orderNumber: `MO-${Date.now()}`,
                    recipeId: parseInt(data.recipeId),
                    machineId: parseInt(data.machineId),
                    stockId: parseInt(data.stockId),
                    quantity: parseFloat(data.quantity),
                    status: 'PLANNED',
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    totalCost: 0 // Will be computed upon completion based on ingredients
                }
            });
            return NextResponse.json({ message: 'تم تخطيط أمر التصنيع', order });
        }

        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    } catch (error: any) {
        console.error('Create MRP Entity Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
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
        if (action === 'START' && order.machineId) {
            await prisma.machine.update({ where: { id: order.machineId }, data: { status: 'RUNNING' } });
        }
        if (action === 'COMPLETE' && order.machineId) {
            await prisma.machine.update({ where: { id: order.machineId }, data: { status: 'IDLE' } });
        }

        return NextResponse.json({ message: `تم تحديث حالة الأمر إلى ${newStatus}` });
    } catch (error: any) {
        console.error('Update MRP Entity Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
