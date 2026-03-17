import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const orders = await prisma.manufacturingOrder.findMany({
            include: {
                recipe: {
                    include: {
                        finishedProduct: { select: { id: true, name: true } },
                        ingredients: { include: { rawProduct: { select: { id: true, name: true } } } }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.recipeId || !body.quantityToProduce) {
            return NextResponse.json({ error: 'الوصفة والكمية مطلوبة' }, { status: 400 });
        }

        const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(body.recipeId) } });
        if (!recipe) return NextResponse.json({ error: 'الوصفة غير موجودة' }, { status: 404 });

        const qty = parseFloat(body.quantityToProduce);
        const lastOrder = await prisma.manufacturingOrder.findFirst({ orderBy: { id: 'desc' } });
        const orderNum = (lastOrder ? parseInt(lastOrder.orderNumber.replace('MO-', '')) + 1 : 1);

        const order = await prisma.manufacturingOrder.create({
            data: {
                orderNumber: `MO-${String(orderNum).padStart(5, '0')}`,
                recipeId: parseInt(body.recipeId),
                quantityToProduce: qty,
                status: 'draft',
                totalCost: recipe.totalCost * qty,
                stockId: body.stockId ? parseInt(body.stockId) : 1,
                notes: body.notes || null,
            },
            include: { recipe: { include: { finishedProduct: true } } }
        });
        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
