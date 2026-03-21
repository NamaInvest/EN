import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncProductToSalla } from '@/lib/salla';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true, unit: true, productStocks: { include: { stock: true } } },
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
                active: body.active !== undefined ? Boolean(body.active) : undefined,
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
