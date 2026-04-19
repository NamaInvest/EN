import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { syncProductToSalla } from '@/lib/salla';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    } catch (error) {
        console.error('Product GET error:', error);
        return NextResponse.json({ error: 'خطأ' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();
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
                await prisma.productStock.upsert({
                    where: { productId_stockId: { productId: product.id, stockId: defaultStockId } },
                    update: { quantity: product.currentStock },
                    create: { productId: product.id, stockId: defaultStockId, quantity: product.currentStock },
                });
            }
        } catch (e) {
            console.error('Failed to sync product stock:', e);
        }

        // Output to Salla Network
        await syncProductToSalla(product);

        return NextResponse.json(product);
    } catch (error) {
        console.error('Product update error:', error);
        return NextResponse.json({ error: 'فشل في التحديث' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

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
            await prisma.product.update({
                where: { id: productId },
                data: { active: false },
            });
            return NextResponse.json({ message: 'تم أرشفة المنتج وإيقاف تفعيله (لوجود حركات مالية مرتبطة)' });
        }

        // Only hard delete if STRICTLY unused anywhere
        await prisma.$transaction(async (tx) => {
            await tx.productStock.deleteMany({ where: { productId } });
            await tx.product.delete({ where: { id: productId } });
        });

        return NextResponse.json({ message: 'تم حذف المنتج نهائياً لعدم وجود حركات مرتبطة به' });
    } catch (error: any) {
        console.error('Product delete error:', error);
        return NextResponse.json({ error: 'فشل في عملية الحذف/الأرشفة' }, { status: 500 });
    }
}
