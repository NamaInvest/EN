import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const recipeId = searchParams.get('recipeId');

        const recipes = await prisma.recipe.findMany({
            take: 100,
            where: recipeId ? { id: Number(recipeId) } : {},
            include: {
                operations: {
                    include: { workCenter: true },
                    orderBy: { sequenceNumber: 'asc' }
                }
            }
        });

        const workCenters = await prisma.workCenter.findMany({
            take: 100,
            where: { isActive: true }
        });

        return NextResponse.json({ success: true, data: { recipes, workCenters } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  recipeId: z.union([z.string(), z.number()]).optional(),
  operations: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { recipeId, operations } = body; // Array of operations

        // Start transaction: delete old operations for this recipe, create new ones
        await prisma.$transaction([
            prisma.recipeOperation.deleteMany({
                where: { recipeId: Number(recipeId) }
            }),
            prisma.recipeOperation.createMany({
                data: operations.map((op: any, index: number) => ({
                    recipeId: Number(recipeId),
                    workCenterId: Number(op.workCenterId),
                    operationName: op.operationName,
                    sequenceNumber: index + 1, // Reset sequence based on array order
                    durationMinutes: Number(op.durationMinutes)
                }))
            })
        ]);

        return NextResponse.json({ success: true, message: 'Routing updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
