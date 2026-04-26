import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { syncProductToSalla } from '@/lib/salla';
import { checkQuota, quotaErrorResponse } from '@/lib/quotaGuard';

async function hasPermission(prisma: any, userId: number, module: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { permissions: true } });
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.permissions.length > 0) return user.permissions.some((p: any) => p.module === module);
    return false;
}

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('category_id');
        const includeInactive = searchParams.get('include_inactive') === 'true';
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '0');

        const where: Record<string, unknown> = {};
        if (!includeInactive) {
            where.active = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoryId) where.categoryId = parseInt(categoryId);

        if (page > 0 && limit > 0) {
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where,
                    include: { category: true, unit: true, productStocks: { include: { stock: true } }, productUnits: true },
                    orderBy: { id: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.product.count({ where }),
            ]);
            return NextResponse.json(products, {
                headers: { 'X-Total-Count': String(total) },
            });
        }

        const products = await prisma.product.findMany({
            where,
            include: { category: true, unit: true, productStocks: { include: { stock: true } }, productUnits: true },
            orderBy: { id: 'desc' },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Products GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        // --- Quota Guard (Product Limit) ---
        const tenant = (request as any).headers?.get?.('x-tenant') ||
            (request instanceof Request ? request.headers.get('x-tenant') : null);
        if (tenant) {
            const quotaCheck = await checkQuota(tenant, 'product');
            if (!quotaCheck.allowed) return quotaErrorResponse(quotaCheck);
        }
        // -----------------------------------

        // Auto-generate barcode if not provided
        let barcode = body.barcode || null;
        if (!barcode) {
            // Use a dedicated counter in settings, starting from 1000
            const setting = await prisma.setting.findUnique({ where: { key: 'next_barcode' } });
            const nextBarcode = setting && setting.value ? parseInt(String(setting.value), 10) : 1000;
            barcode = String(nextBarcode);
            // Update counter for next time
            await prisma.setting.upsert({
                where: { key: 'next_barcode' },
                update: { value: String(nextBarcode + 1) },
                create: { key: 'next_barcode', value: String(nextBarcode + 1) },
            });
        }

        // Pure UncheckedCreateInput - all scalar FKs, no relation connect
        const productData: any = {
                name: body.name,
                barcode,
                unitId: body.unitId ? parseInt(body.unitId) : 1,
                buyPrice: parseFloat(body.buyPrice) || 0,
                sellPrice: parseFloat(body.sellPrice) || 0,
                taxRate: parseFloat(body.taxRate) ?? 15,
                minQuantity: parseFloat(body.minQuantity) || 0,
                currentStock: parseFloat(body.currentStock) || 0,
                description: body.description || null,
                nameEn: body.nameEn || body.name || '',
                brandAr: body.brandAr || '',
                brandEn: body.brandEn || '',
                sizeInfo: body.sizeInfo || '',
                sellByWeight: body.sellByWeight || false,
                expiryDate: body.expiryDate || null,
                binLocation: body.binLocation || null,
                imagePath: body.imagePath || '',
        };
        if (body.categoryId) productData.categoryId = parseInt(body.categoryId);

        const product = await prisma.product.create({
            data: productData,
        });

        // Create product units separately (nested relation)
        if (body.productUnits && Array.isArray(body.productUnits) && body.productUnits.length > 0) {
            await prisma.productUnit.createMany({
                data: body.productUnits.map((pu: any) => ({
                    productId: product.id,
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
            });
        }

        // Initialize stock in default warehouse (ID 1)
        try {
            const defaultStockId = 1;
            const existingWarehouse = await prisma.stock.findUnique({ where: { id: defaultStockId } });
            if (!existingWarehouse) {
                await prisma.stock.create({ data: { id: defaultStockId, name: 'المستودع الرئيسي', active: true } });
            }
            if (product.currentStock > 0) {
                await prisma.productStock.create({
                    data: {
                        productId: product.id,
                        stockId: defaultStockId,
                        quantity: product.currentStock,
                    }
                });
                
                // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                const auth = getUserFromRequest(request as any);
                await prisma.stockMovement.create({
                    data: {
                        productId: product.id,
                        stockId: defaultStockId,
                        type: 'adjustment_in',
                        quantity: product.currentStock,
                        referenceType: 'initial_stock',
                        referenceId: product.id,
                        userId: auth?.userId || null,
                        notes: 'رصيد افتتاحي عند الإنشاء'
                    }
                });
            }
        } catch (e) {
            console.error('Failed to initialize product stock:', e);
        }

        // Push to Salla if configured
        await syncProductToSalla(product);

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Product create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء المنتج' }, { status: 500 });
    }
}

// Stock reset: set all products' currentStock to 0
export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'delete_all') {
            const allowed = await hasPermission(prisma, auth.userId, 'delete_products');
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف المنتجات' }, { status: 403 });

            await prisma.productStock.deleteMany({});
            try {
                const result = await prisma.product.deleteMany({});
                return NextResponse.json({ success: true, message: `تم حذف ${result.count} منتج نهائياً` });
            } catch (e) {
                // Fallback to soft delete
                const result = await prisma.product.updateMany({ data: { active: false } });
                return NextResponse.json({ success: true, message: `تم أرشفة ${result.count} منتج لوجود حركات مالية` });
            }
        }

        const allowed = await hasPermission(prisma, auth.userId, 'reset_stock');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تصفير المخزون' }, { status: 403 });

        const result = await prisma.product.updateMany({ data: { currentStock: 0 } });
        return NextResponse.json({ success: true, message: `تم تصفير مخزون ${result.count} منتج` });
    } catch (error) {
        console.error('Products stock reset error:', error);
        return NextResponse.json({ error: 'فشل في تصفير المخزون' }, { status: 500 });
    }
}
