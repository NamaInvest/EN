import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                finishedProduct: { select: { id: true, name: true, sellPrice: true } },
                ingredients: {
                    include: { rawProduct: { select: { id: true, name: true, buyPrice: true } } }
                },
                _count: { select: { orders: true } }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(recipes);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.name || !body.finishedProductId) {
            return NextResponse.json({ error: 'اسم الوصفة والمنتج النهائي مطلوبان' }, { status: 400 });
        }
        const ingredients = body.ingredients || [];
        const totalCost = ingredients.reduce((sum: number, i: any) => sum + (parseFloat(i.estimatedCost) || 0), 0);

        const recipe = await prisma.recipe.create({
            data: {
                name: body.name,
                finishedProductId: parseInt(body.finishedProductId),
                totalCost,
                isActive: true,
                ingredients: {
                    create: ingredients.map((i: any) => ({
                        rawProductId: parseInt(i.rawProductId),
                        quantity: parseFloat(i.quantity) || 1,
                        estimatedCost: parseFloat(i.estimatedCost) || 0
                    }))
                }
            },
            include: { ingredients: true, finishedProduct: true }
        });
        return NextResponse.json(recipe, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
