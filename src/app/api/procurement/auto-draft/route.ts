import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId } }) : null;

        // 1. Fetch exactly what is deficient
        const allProducts = await prisma.product.findMany({
            take: 100,
            where: { active: true }
        });

        const deficientProducts = allProducts.filter(p => p.currentStock <= p.minQuantity);

        if (deficientProducts.length === 0) {
            return NextResponse.json({ message: 'المخزون آمن، لا توجد نواقص تستدعي إنشاء أمر شراء.' }, { status: 400 });
        }

        // 2. Generate a Draft Purchase Order
        const lastOrder = await prisma.purchaseOrder.findFirst({ orderBy: { orderNo: 'desc' } });
        const orderNo = (lastOrder?.orderNo || 0) + 1;

        // Calculate a safe "Restock Quantity" (either minQuantity x 2, or a fixed threshold)
        // Here we recommend buying enough to reach double the minimum quantity
        const recommendedItems = deficientProducts.map(p => {
            let recommendedQty = (p.minQuantity * 2) - p.currentStock;
            if (recommendedQty <= 0) recommendedQty = p.minQuantity || 1; // Fallback
            
            return {
                productId: p.id,
                productName: p.name,
                quantity: recommendedQty,
                price: p.buyPrice || 0,
                total: recommendedQty * (p.buyPrice || 0)
            };
        });

        const overallTotal = recommendedItems.reduce((acc, curr) => acc + curr.total, 0);

        const draftOrder = await prisma.purchaseOrder.create({
            data: {
                orderNo,
                date: new Date(),
                subtotal: overallTotal,
                total: overallTotal,
                status: 'pending', // Pending == Draft
                userId: user?.id || null,
                notes: `أمر شراء مُنشأ آلياً بواسطة (محرك النواقص) لتغطية العجز البالغ ${deficientProducts.length} منتجات.`,
                details: {
                    create: recommendedItems
                }
            },
            include: { details: true }
        });

        return NextResponse.json(draftOrder, { status: 201 });

    } catch (e: any) {
        console.error("Auto-Draft PO Error:", e);
        return NextResponse.json({ error: e.message || 'فشل توليد أمر الشراء الآلي' }, { status: 500 });
    }
}
