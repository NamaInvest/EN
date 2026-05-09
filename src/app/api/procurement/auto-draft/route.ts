import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId } }) : null;

        // 1. Fetch exactly what is deficient
        const allProducts = await prisma.product.findMany({
            take: 100,
            where: { active: true }
        });

        const deficientProducts = allProducts.filter(p => n(p.currentStock) <= n(p.minQuantity));

        if (deficientProducts.length === 0) {
            return NextResponse.json({ message: 'المخزون آمن، لا توجد نواقص تستدعي إنشاء أمر شراء.' }, { status: 400 });
        }

        // 2. Generate a Draft Purchase Order
        const lastOrder = await prisma.purchaseOrder.findFirst({ orderBy: { orderNo: 'desc' } });
        const orderNo = (lastOrder?.orderNo || 0) + 1;

        // Calculate a safe "Restock Quantity" (either minQuantity x 2, or a fixed threshold)
        // Here we recommend buying enough to reach double the minimum quantity
        const recommendedItems = deficientProducts.map(p => {
            let recommendedQty = (n(p.minQuantity) * 2) - n(p.currentStock);
            if (recommendedQty <= 0) recommendedQty = n(p.minQuantity) || 1; // Fallback
            
            return {
                productId: p.id,
                productName: p.name,
                quantity: recommendedQty,
                price: n(p.buyPrice) || 0,
                total: recommendedQty * (n(p.buyPrice) || 0)
            };
        });

        const overallTotal = recommendedItems.reduce((acc: number, curr: any) => acc + curr.total, 0);

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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
