import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const recipes: any = await prisma.recipe.findMany({
            include: {
                finishedProduct: true,
                ingredients: {
                    include: { rawProduct: true }
                },
                operations: {
                    include: { workCenter: true }
                },
                byProducts: {
                    include: { product: true }
                }
            } as any,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(recipes);
    } catch (error) {
        console.error("BOM GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch BOMs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { finishedProductId, name, scrapPercentage, ingredients, operations, byProducts } = body;

        // Calculate total estimated cost based on ingredients (just raw materials for now)
        let totalCost = 0;
        
        // Wrap in transaction
        const recipe = await prisma.$transaction(async (tx: any) => {
            const newRecipe = await tx.recipe.create({
                data: {
                    finishedProductId: parseInt(finishedProductId),
                    name,
                    scrapPercentage: parseFloat(scrapPercentage) || 0,
                    totalCost: 0 // Will update after
                } as any
            });

            // Add ingredients
            if (ingredients && ingredients.length > 0) {
                for (const item of ingredients) {
                    const prod = await tx.product.findUnique({ where: { id: parseInt(item.rawProductId) }});
                    const estCost = (prod?.buyPrice || 0) * parseFloat(item.quantity);
                    totalCost += estCost;

                    await tx.recipeIngredient.create({
                        data: {
                            recipeId: newRecipe.id,
                            rawProductId: parseInt(item.rawProductId),
                            quantity: parseFloat(item.quantity),
                            scrapPercentage: parseFloat(item.scrapPercentage) || 0,
                            estimatedCost: estCost
                        } as any
                    });
                }
            }

            // Add operations (Work Center Routing)
            if (operations && operations.length > 0) {
                for (const op of operations) {
                    const wc = await tx.workCenter.findUnique({ where: { id: parseInt(op.workCenterId) } });
                    if (wc) {
                        totalCost += (wc.costPerHour * (parseFloat(op.durationMinutes) / 60));
                    }
                    await tx.recipeOperation.create({
                        data: {
                            recipeId: newRecipe.id,
                            workCenterId: parseInt(op.workCenterId),
                            operationName: op.operationName,
                            sequenceNumber: parseInt(op.sequenceNumber),
                            durationMinutes: parseFloat(op.durationMinutes)
                        }
                    });
                }
            }

            // Update recipe total cost
            await tx.recipe.update({
                where: { id: newRecipe.id },
                data: { totalCost }
            });

            return newRecipe;
        });

        return NextResponse.json({ message: 'تم إنشاء تركيبة المنتج (BOM) بنجاح', data: recipe });
    } catch (error) {
        console.error("BOM POST error:", error);
        return NextResponse.json({ error: 'Failed to create BOM' }, { status: 500 });
    }
}
