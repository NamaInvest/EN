import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 7: MRP Interface API
 *
 * Schema facts:
 * - ManufacturingOrder: recipeId (Int), quantityToProduce (Float) — include recipe to get ingredients
 * - Product: minQuantity (Float), no 'sku' field — barcode instead
 * - PurchaseRequisition: reqNo (Int not 'requisitionNo'), requestedBy (Int)
 * - PurchaseRequisitionDetail: reqId (Int)
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.mrp' });

interface MRPItem {
    productId: number;
    productName: string;
    requiredQty: number;
    availableQty: number;
    shortfall: number;
    suggestedPOQty: number;
    unitName: string;
}

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        // Include recipe and its ingredients with raw product info
        const openOrders = await prisma.manufacturingOrder.findMany({ take: 100,
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
                                        minQuantity: true,   // correct field name
                                        barcode: true,       // no 'sku' field — use barcode
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

                const requiredQty = n(ing.quantity) * n(order.quantityToProduce); // correct field
                const existing = requirementsMap.get(product.id);

                if (existing) {
                    existing.requiredQty += requiredQty;
                    existing.shortfall = Math.max(0, existing.requiredQty - existing.availableQty);
                    existing.suggestedPOQty = existing.shortfall;
                } else {
                    const shortfall = Math.max(0, requiredQty - n(product.currentStock));
                    requirementsMap.set(product.id, {
                        productId: product.id,
                        productName: product.name,
                        requiredQty,
                        availableQty: n(product.currentStock),
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
    } catch (e: any) {
        log.error('MRP GET error:', e);
        return NextResponse.json({ error: 'خطأ في تشغيل MRP' }, { status: 500 });
    }
}

// POST — Convert MRP suggestions into Purchase Requisitions
async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { items }: { items: MRPItem[] } = await req.json();
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'لا توجد عناصر' }, { status: 400 });
        }

        // PurchaseRequisition uses 'reqNo' not 'requisitionNo'
        const lastPR = await prisma.purchaseRequisition.findFirst({ orderBy: { id: 'desc' } });
        const nextReqNo = (lastPR?.reqNo || 1000) + 1;

        const validItems = items.filter(i => i.suggestedPOQty > 0);

        const pr = await prisma.purchaseRequisition.create({
            data: {
                reqNo: nextReqNo,                   // correct field
                requestedBy: user.userId,
                status: 'pending',
                notes: `طلب شراء تلقائي من محرك MRP — ${new Date().toLocaleDateString('ar-SA')}`,
                details: {
                    create: validItems.map(i => ({
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
            reqNo: nextReqNo,
            itemsCreated: validItems.length,
        }, { status: 201 });
    } catch (e: any) {
        log.error('MRP POST error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء طلبات الشراء' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
