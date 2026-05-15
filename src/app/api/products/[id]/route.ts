import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import type { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { syncProductToSalla } from '@/lib/salla';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runInventoryTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'products/id' });
async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true, unit: true, productStocks: { include: { stock: true } }, productUnits: true },
        });
        if (!product) {
            return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
        }
        return NextResponse.json(product);
    } catch (error: any) {
        log.error('Product GET error:', error);
        return NextResponse.json({ error: 'خطأ' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  name: z.any().optional(),
  barcode: z.any().optional(),
  categoryId: z.union([z.string(), z.number()]).optional(),
  unitId: z.union([z.string(), z.number()]).optional(),
  buyPrice: z.number().optional(),
  sellPrice: z.number().optional(),
  taxRate: z.number().optional(),
  minQuantity: z.number().optional(),
  currentStock: z.any().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const productId = parseInt(id);
        const auth = getUserFromRequest(request as unknown as NextRequest);
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        // Read before state for audit trail
        const before = await prisma.product.findUnique({ where: { id: productId } });

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name: body.name,
                barcode: body.barcode || null,
                categoryId: body.categoryId ? parseInt(body.categoryId) : null,
                unitId: body.unitId ? parseInt(body.unitId) : 1,
                buyPrice: parseFloat(body.buyPrice) || 0,
                sellPrice: parseFloat(body.sellPrice) || 0,
                taxRate: parseFloat(body.taxRate) ?? 15,
                minQuantity: parseFloat(body.minQuantity) || 0,
                currentStock: parseFloat(body.currentStock) || 0,
                description: body.description || null,
                nameEn: body.nameEn || '',
                sellByWeight: body.sellByWeight || false,
                expiryDate: body.expiryDate || null,
                binLocation: body.binLocation || null,
                imagePath: body.imagePath !== undefined ? (body.imagePath || '') : undefined,
                active: body.active !== undefined ? Boolean(body.active) : undefined,
                productUnits: {
                    deleteMany: {},
                    ...(body.productUnits && Array.isArray(body.productUnits) ? {
                        create: body.productUnits.map((pu: any) => ({
                            unitId: parseInt(pu.unitId),
                            barcode: pu.barcode || null,
                            sellPrice: parseFloat(pu.sellPrice) || 0,
                            buyPrice: parseFloat(pu.buyPrice) || 0,
                            factor: parseFloat(pu.factor) || parseFloat(pu.parentQty) || 1,
                            isBase: Boolean(pu.isBase),
                            unitStock: parseFloat(pu.unitStock) || 0,
                            parentQty: parseFloat(pu.parentQty) || 1,
                            parentUnitId: pu.parentUnitId ? parseInt(pu.parentUnitId) : null,
                            sortOrder: parseInt(pu.sortOrder) || 0,
                        }))
                    } : {})
                }
            },
        });

        // Sync legacy currentStock to default warehouse (ID 1)
        try {
            if (body.currentStock !== undefined) {
                const defaultStockId = 1;
                const existingWarehouse = await prisma.stock.findUnique({ where: { id: defaultStockId } });
                if (!existingWarehouse) {
                    await prisma.stock.create({ data: { id: defaultStockId, name: 'المستودع الرئيسي', active: true } });
                }
                await runInventoryTx(prisma, async (tx: any) => {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: product.id, stockId: defaultStockId } },
                        update: { quantity: product.currentStock },
                        create: { productId: product.id, stockId: defaultStockId, quantity: product.currentStock },
                    });
                });
            }
        } catch (e: any) {
            log.error('Failed to sync product stock:', e);
        }

        // Output to Salla Network
        await syncProductToSalla(product);

        // Audit trail — log field changes
        try {
            await logFieldChanges(prisma, 'Product', productId, before, product, auditContextFromRequest(request, auth ?? undefined));
        } catch (e: any) { log.error('[audit] Product update audit failed:', e); }

        return NextResponse.json(product);
    } catch (error: any) {
        log.error('Product update error:', error);
        return NextResponse.json({ error: 'فشل في التحديث' }, { status: 500 });
    }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as unknown as NextRequest);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const productId = parseInt(id);

        // STABLE ERP LOGIC: NEVER cascade delete financial records.
        // Check if the product is used in any transactions.
        const usedInSales = await prisma.salesInvoiceDetail.count({ where: { productId } });
        const usedInPurchases = await prisma.purchaseInvoiceDetail.count({ where: { productId } });
        const usedInStockMovements = await prisma.stockMovement.count({ where: { productId } });

        if (usedInSales > 0 || usedInPurchases > 0 || usedInStockMovements > 0) {
            // Soft delete: keep the product but mark it inactive so it doesn't appear in POS/Purchases
            const beforeProduct = await prisma.product.findUnique({ where: { id: productId } });
            await prisma.product.update({
                where: { id: productId },
                data: { active: false },
            });
            try {
                await logFieldChanges(prisma, 'Product', productId, beforeProduct, { ...beforeProduct, active: false } as any, auditContextFromRequest(request, auth));
            } catch (e: any) { log.error('[audit] Product archive audit failed:', e); }
            return NextResponse.json({ message: 'تم أرشفة المنتج وإيقاف تفعيله (لوجود حركات مالية مرتبطة)' });
        }

        // Only hard delete if STRICTLY unused anywhere — audit first
        const beforeDel = await prisma.product.findUnique({ where: { id: productId } });
        try {
            if (beforeDel) await logDelete(prisma, 'Product', productId, beforeDel as any, auditContextFromRequest(request, auth));
        } catch (e: any) { log.error('[audit] Product delete audit failed:', e); }

        await runInventoryTx(prisma, async (tx: any) => {
            await tx.productStock.deleteMany({ where: { productId } });
            await tx.product.delete({ where: { id: productId } });
        });

        return NextResponse.json({ message: 'تم حذف المنتج نهائياً لعدم وجود حركات مرتبطة به' });
    } catch (error: any) {
        log.error('Product delete error:', error);
        return NextResponse.json({ error: 'فشل في عملية الحذف/الأرشفة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
