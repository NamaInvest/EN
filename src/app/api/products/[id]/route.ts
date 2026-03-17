import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true, unit: true },
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
            },
        });
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

        // Delete related records first to avoid foreign key constraints
        await prisma.$transaction(async (tx) => {
            // Delete sale invoice items referencing this product
            await tx.salesInvoiceDetail.deleteMany({ where: { productId } });
            // Delete purchase invoice items referencing this product
            await tx.purchaseInvoiceDetail.deleteMany({ where: { productId } });
            // Delete stock movements referencing this product
            await tx.stockMovement.deleteMany({ where: { productId } });
            // Now delete the product
            await tx.product.delete({ where: { id: productId } });
        });

        return NextResponse.json({ message: 'تم حذف المنتج بنجاح' });
    } catch (error: any) {
        console.error('Product delete error:', error);
        // If still fails (other constraints), deactivate instead
        try {
            const { id } = await params;
            await prisma.product.update({
                where: { id: parseInt(id) },
                data: { active: false },
            });
            return NextResponse.json({ message: 'تم إلغاء تفعيل المنتج (مرتبط ببيانات أخرى)' });
        } catch {
            return NextResponse.json({ error: 'فشل في الحذف' }, { status: 500 });
        }
    }
}
