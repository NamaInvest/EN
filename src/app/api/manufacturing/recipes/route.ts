import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.recipes' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const recipes = await prisma.recipe.findMany({ take: 100,
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
        log.error(error);
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  finishedProductId: z.union([z.string(), z.number()]).optional(),
  ingredients: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
        log.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/recipes' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
