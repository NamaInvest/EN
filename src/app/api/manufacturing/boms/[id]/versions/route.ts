import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.boms.id.versions' });

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const tenantId = requireTenantId(req as any);

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const productId = Number((await params).id);

        // Fetch Product and its associated BOM versions
        // A product has multiple recipes, each recipe might have a BOMVersion
        const product = await prisma.product.findUnique({
            where: { id: productId , tenantId },
            include: {
                finishedRecipes: {
                    include: {
                        ingredients: { include: { rawProduct: true } },
                        BOMVersion: true
                    }
                }
            }
        });

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Flatten BOM versions
        const versions: any[] = [];
        product.finishedRecipes.forEach(recipe => {
            recipe.BOMVersion.forEach(version => {
                versions.push({
                    ...version,
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    ingredients: recipe.ingredients
                });
            });
        });

        // Sort by effective date descending
        versions.sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

        return NextResponse.json({ success: true, data: { product, versions } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  sourceVersionId: z.union([z.string(), z.number()]).optional(),
  newVersionNumber: z.any().optional(),
  ingredients: z.any().optional(),
  ecrReference: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req as any);
    try {
        const productId = Number((await params).id);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { sourceVersionId, newVersionNumber, ingredients, ecrReference } = body;

        // Clone flow:
        // 1. Create new Recipe
        // 2. Create new RecipeIngredients
        // 3. Create new BOMVersion (DRAFT)
        // 4. Optionally create ECO if ecrReference is provided

        const newRecipe = await prisma.recipe.create({
            data: {
                finishedProductId: productId,
                name: `BOM ${newVersionNumber} for Product ${productId}`,
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        rawProductId: Number(ing.rawProductId),
                        quantity: Number(ing.quantity),
                        estimatedCost: Number(ing.estimatedCost || 0),
                        scrapPercentage: Number(ing.scrapPercentage || 0)
                    }))
                }
            }
        });

        const newVersion = await prisma.bOMVersion.create({
            data: {
                recipeId: newRecipe.id,
                versionNumber: newVersionNumber,
                effectiveFrom: new Date(),
                status: 'DRAFT'
            }
        });

        if (ecrReference && sourceVersionId) {
            await prisma.engineeringChangeOrder.create({
                data: {
                    ecoNumber: `ECO-${Date.now()}`,
                    productId: productId,
                    fromBomVersionId: Number(sourceVersionId),
                    toBomVersionId: newVersion.id,
                    reason: `Update from ${ecrReference}`,
                    status: 'PENDING',
                    requestedBy: 1 // Default user
                }
            });
        }

        return NextResponse.json({ success: true, data: newVersion });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
