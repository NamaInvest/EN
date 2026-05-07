import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
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

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
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
