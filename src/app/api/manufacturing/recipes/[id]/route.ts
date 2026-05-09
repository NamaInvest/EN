import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _PUTSchema = z.object({
  ingredients: z.any().optional(),
  name: z.any().optional(),
  finishedProductId: z.union([z.string(), z.number()]).optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const recipeId = parseInt(id);

        // Delete old ingredients and recreate
        if (body.ingredients) {
            await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
            const ingredients = body.ingredients || [];
            const totalCost = ingredients.reduce((sum: number, i: any) => sum + (parseFloat(i.estimatedCost) || 0), 0);

            const recipe = await prisma.recipe.update({
                where: { id: recipeId },
                data: {
                    name: body.name,
                    finishedProductId: body.finishedProductId ? parseInt(body.finishedProductId) : undefined,
                    totalCost,
                    isActive: body.isActive !== undefined ? body.isActive : true,
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
            return NextResponse.json(recipe);
        }

        const recipe = await prisma.recipe.update({
            where: { id: recipeId },
            data: {
                name: body.name,
                isActive: body.isActive !== undefined ? body.isActive : undefined,
            }
        });
        return NextResponse.json(recipe);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/recipes/[id]' });
    }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const recipeId = parseInt(id);
        const orderCount = await prisma.manufacturingOrder.count({ where: { recipeId } });
        if (orderCount > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف الوصفة لوجود أوامر تصنيع مرتبطة بها' }, { status: 400 });
        }
        await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
        await prisma.recipe.delete({ where: { id: recipeId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/recipes/[id]' });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
