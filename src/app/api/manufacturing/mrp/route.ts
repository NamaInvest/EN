/**
 * Priority 7: MRP (Material Requirements Planning) Interface API
 * يوفر واجهة لمحرك الـ MRP الموجود في @/lib/mrp-engine
 * GET  /api/manufacturing/mrp — احتياجات الخامات
 * POST /api/manufacturing/mrp — تشغيل MRP وإنشاء أوامر شراء مقترحة
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface MRPItem {
    productId: number;
    productName: string;
    requiredQty: number;
    availableQty: number;
    shortfall: number;
    suggestedPOQty: number;
    unitName: string;
}

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        // Get open manufacturing orders
        const openOrders = await prisma.manufacturingOrder.findMany({
            where: { status: { in: ['pending', 'in_progress'] } },
            include: {
                recipe: {
                    include: {
                        ingredients: {
                            include: {
                                rawProduct: {
                                    select: {
                                        id: true,
                                        name: true,
                                        currentStock: true,
                                        minStock: true,
                                        unit: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const requirementsMap = new Map<number, MRPItem>();

        for (const order of openOrders) {
            if (!order.recipe?.ingredients) continue;

            for (const ing of order.recipe.ingredients) {
                const product = ing.rawProduct;
                if (!product) continue;

                const requiredQty = ing.quantity * order.plannedQty;
                const existing = requirementsMap.get(product.id);

                if (existing) {
                    existing.requiredQty += requiredQty;
                    existing.shortfall = Math.max(0, existing.requiredQty - existing.availableQty);
                    existing.suggestedPOQty = existing.shortfall;
                } else {
                    const shortfall = Math.max(0, requiredQty - product.currentStock);
                    requirementsMap.set(product.id, {
                        productId: product.id,
                        productName: product.name,
                        requiredQty,
                        availableQty: product.currentStock,
                        shortfall,
                        suggestedPOQty: shortfall,
                        unitName: product.unit?.name || 'وحدة',
                    });
                }
            }
        }

        const requirements = Array.from(requirementsMap.values());
        const criticalItems = requirements.filter(r => r.shortfall > 0);

        return NextResponse.json({
            generatedAt: new Date().toISOString(),
            openOrders: openOrders.length,
            totalRequirements: requirements.length,
            criticalItems: criticalItems.length,
            requirements,
            criticalOnly: criticalItems,
        });
    } catch (e) {
        console.error('MRP GET error:', e);
        return NextResponse.json({ error: 'خطأ في تشغيل MRP' }, { status: 500 });
    }
}

// POST — Convert MRP suggestions into actual Purchase Requisitions
export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { items }: { items: MRPItem[] } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'لا توجد عناصر لإنشاء طلبات شراء' }, { status: 400 });
        }

        // Auto-generate PR number
        const lastPR = await prisma.purchaseRequisition.findFirst({ orderBy: { id: 'desc' } });
        const nextPRNo = (lastPR?.requisitionNo || 1000) + 1;

        const pr = await prisma.purchaseRequisition.create({
            data: {
                requisitionNo: nextPRNo,
                requestedBy: user.userId,
                status: 'pending',
                notes: `طلب شراء تلقائي من محرك MRP — ${new Date().toLocaleDateString('ar-SA')}`,
                details: {
                    create: items
                        .filter(i => i.suggestedPOQty > 0)
                        .map(i => ({
                            productId: i.productId,
                            productName: i.productName,
                            requestedQty: i.suggestedPOQty,
                            notes: `MRP: مطلوب ${i.requiredQty} — متاح ${i.availableQty}`,
                        })),
                },
            },
        });

        return NextResponse.json({
            success: true,
            prId: pr.id,
            prNo: nextPRNo,
            itemsCreated: items.filter(i => i.suggestedPOQty > 0).length,
        }, { status: 201 });
    } catch (e) {
        console.error('MRP POST error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء طلبات الشراء' }, { status: 500 });
    }
}
