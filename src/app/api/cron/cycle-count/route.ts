import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        // Fetch all products with their ABC class
        const products: any[] = await (prisma.product as any).findMany({
            take: 100,
            where: { active: true },
            select: { id: true, abcClass: true, currentStock: true }
        });

        const selectedProducts: any[] = [];

        // Simple probability-based selection to simulate frequencies
        // A: 1/5 (20%), B: 1/30 (3.3%), C: 1/90 (1.1%)
        products.forEach(p => {
            const rand = Math.random();
            let probability = 0;
            if (p.abcClass === 'A') probability = 1 / 5;
            else if (p.abcClass === 'B') probability = 1 / 30;
            else if (p.abcClass === 'C') probability = 1 / 90;
            else probability = 1 / 365; // Default once a year for unclassified

            if (rand <= probability) {
                selectedProducts.push(p);
            }
        });

        if (selectedProducts.length === 0) {
            return NextResponse.json({ success: true, message: 'No items scheduled for cycle count today.' });
        }

        // Generate a new Stocktake
        const stocktake = await prisma.stocktake.create({
            data: {
                stocktakeDate: new Date().toISOString().split('T')[0],
                totalItems: selectedProducts.length,
                status: 'pending', // Pending count
                notes: 'Auto-generated Cycle Count Schedule',
                items: {
                    create: selectedProducts.map(p => ({
                        productId: p.id,
                        systemQty: p.currentStock,
                        actualQty: 0,
                        difference: 0,
                        status: 'pending'
                    }))
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Cycle count generated with ${selectedProducts.length} items.`,
            stocktakeId: stocktake.id
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
