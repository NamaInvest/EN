import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'manufacturing.routing' });

async function _GET(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const { searchParams } = new URL(req.url);
        const recipeId = searchParams.get('recipeId');

        const recipes = await prisma.recipe.findMany({ 
            take: 100,
            where: {
                ...requireTenantFilter({ tenantId }),
                ...(recipeId ? { id: Number(recipeId) } : {})
            },
            include: {
                operations: {
                    include: { workCenter: true },
                    orderBy: { sequenceNumber: 'asc' }
                }
            }
        });

        const workCenters = await prisma.workCenter.findMany({ 
            take: 100,
            where: { 
                isActive: true,
                ...requireTenantFilter({ tenantId })
            }
        });

        return NextResponse.json({ success: true, data: { recipes, workCenters } });
    } catch (e: any) {
        log.error('manufacturing.routing.GET', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  recipeId: z.union([z.string(), z.number()]).optional(),
  operations: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { recipeId, operations } = body; // Array of operations

        // Verify Recipe belongs to tenant
        const recipe = await prisma.recipe.findFirst({
            where: { id: Number(recipeId), ...requireTenantFilter({ tenantId }) }
        });
        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Start transaction: delete old operations for this recipe, create new ones
        await runFinancialTx(prisma, async (tx) => {
            await tx.recipeOperation.deleteMany({
                where: { recipeId: Number(recipeId), ...requireTenantFilter({ tenantId }) }
            });

            if (operations && operations.length > 0) {
                await tx.recipeOperation.createMany({
                    data: operations.map((op: any, index: number) => ({
                        tenantId,
                        recipeId: Number(recipeId),
                        workCenterId: Number(op.workCenterId),
                        operationName: op.operationName,
                        sequenceNumber: index + 1, // Reset sequence based on array order
                        durationMinutes: Number(op.durationMinutes)
                    }))
                });
            }
        }, 'MANUFACTURING_ROUTING_UPDATE');

        return NextResponse.json({ success: true, message: 'Routing updated successfully' });
    } catch (e: any) {
        log.error('manufacturing.routing.POST', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL' });

