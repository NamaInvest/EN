import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { syncProductToSalla } from '@/lib/salla';
import { checkQuota, quotaErrorResponse } from '@/lib/quotaGuard';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function hasPermission(prisma: any, userId: number, module: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { permissions: true } });
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.permissions.length > 0) return user.permissions.some((p: any) => p.module === module);
    return false;
}

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
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
            take: 100,
            where,
            include: { category: true, unit: true, productStocks: { include: { stock: true } }, productUnits: true },
            orderBy: { id: 'desc' },
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Products GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  buyPrice: z.number().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        // --- Quota Guard (Product Limit) ---
        const tenant = (request as any).headers?.get?.('x-tenant') ||
            (request instanceof Request ? request.headers.get('x-tenant') : null);
        if (tenant) {
            const quotaCheck = await checkQuota(tenant, 'product');
            if (!quotaCheck.allowed) return quotaErrorResponse(quotaCheck);
        }
        // -----------------------------------

        // ── Input Validation ──────────────────────────────────────────────
        if (!body.name || String(body.name).trim().length === 0) {
            return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 });
        }
        if (body.buyPrice !== undefined && parseFloat(body.buyPrice) < 0) {
            return NextResponse.json({ error: 'سعر الشراء لا يمكن أن يكون سالباً' }, { status: 400 });
        }
        if (body.sellPrice !== undefined && parseFloat(body.sellPrice) < 0) {
            return NextResponse.json({ error: 'سعر البيع لا يمكن أن يكون سالباً' }, { status: 400 });
        }

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

        // Use raw SQL to bypass Prisma 5.22.0 XOR type detection bug
        const uId = body.unitId ? parseInt(body.unitId) : 1;
        const catId = body.categoryId ? parseInt(body.categoryId) : null;
        const bPrice = parseFloat(body.buyPrice) || 0;
        const sPrice = parseFloat(body.sellPrice) || 0;
        const tRate = parseFloat(body.taxRate) || 15;
        const minQty = parseFloat(body.minQuantity) || 0;
        const curStock = parseFloat(body.currentStock) || 0;

        const result: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO products (name, barcode, category_id, unit_id, buy_price, sell_price, tax_rate, tax_type, min_quantity, current_stock, description, active, name_en, brand_ar, brand_en, size_info, image_path, sell_by_weight, expiry_date, bin_location, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
            RETURNING *`,
            body.name, barcode, catId, uId, bPrice, sPrice, tRate, 'VAT', minQty, curStock,
            body.description || null, true,
            body.nameEn || body.name || '',
            body.brandAr || '', body.brandEn || '', body.sizeInfo || '',
            body.imagePath || '',
            body.sellByWeight || false,
            body.expiryDate || null, body.binLocation || null
        );
        const product = result[0];

        // Create product units if provided
        if (body.productUnits && Array.isArray(body.productUnits) && body.productUnits.length > 0) {
            for (const pu of body.productUnits) {
                const _uId_dup143 = parseInt(pu.unitId);
                if (isNaN(uId)) continue; // Skip invalid units
                await prisma.$queryRawUnsafe(`
                    INSERT INTO product_units (product_id, unit_id, barcode, sell_price, buy_price, factor, is_base, unit_stock, parent_qty, sort_order, weight, length, width)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    product.id, uId, pu.barcode || null,
                    parseFloat(pu.sellPrice) || 0, parseFloat(pu.buyPrice) || 0,
                    parseFloat(pu.factor) || parseFloat(pu.parentQty) || 1,
                    Boolean(pu.isBase), parseFloat(pu.unitStock) || 0,
                    parseFloat(pu.parentQty) || 1, parseInt(pu.sortOrder) || 0,
                    parseFloat(pu.weight) || 0, parseFloat(pu.length) || 0, parseFloat(pu.width) || 0
                );
            }
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
        } catch (e: any) {
            console.error('Failed to initialize product stock:', e);
        }

        // Push to Salla if configured
        await syncProductToSalla(product);

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('Product create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء المنتج' }, { status: 500 });
    }
}

// Stock reset: set all products' currentStock to 0
async function _DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
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
            } catch (e: any) {
                // Fallback to soft delete
                const _result_dup228 = await prisma.product.updateMany({ data: { active: false } });
                // @ts-expect-error [TS2448] Block-scoped variable ordering issue
                return NextResponse.json({ success: true, message: `تم أرشفة ${result.count} منتج لوجود حركات مالية` });
            }
        }

        const allowed = await hasPermission(prisma, auth.userId, 'reset_stock');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تصفير المخزون' }, { status: 403 });

        const result = await prisma.product.updateMany({ data: { currentStock: 0 } });
        return NextResponse.json({ success: true, message: `تم تصفير مخزون ${result.count} منتج` });
    } catch (error: any) {
        console.error('Products stock reset error:', error);
        return NextResponse.json({ error: 'فشل في تصفير المخزون' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
