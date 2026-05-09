import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const recipes = await prisma.recipe.findMany({
            take: 100,
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
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
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
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/recipes' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
