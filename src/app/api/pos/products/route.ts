import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req);
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const catId = searchParams.get('categoryId');

        const whereClause: any = {
            active: true
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { productUnits: { some: { barcode: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        if (catId && catId !== 'all') {
            whereClause.categoryId = parseInt(catId);
        }

        const [productsList, categories] = await Promise.all([
            prisma.product.findMany({
            take: 100,
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    barcode: true,
                    sellPrice: true,
                    taxRate: true,
                    currentStock: true,
                    categoryId: true,
                    imagePath: true,
                    sellByWeight: true,
                    category: { select: { id: true, name: true } },
                    productUnits: { include: { unit: true } }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.category.findMany({
            take: 100,
                orderBy: { name: 'asc' }
            })
        ]);

        const flattenedProducts: any[] = [];
        productsList.forEach(p => {
            // Base product (Piece)
            flattenedProducts.push({
                id: p.id.toString(),
                name: p.name,
                barcode: p.barcode,
                price: p.sellPrice,
                taxRate: p.taxRate,
                stock: p.currentStock,
                categoryId: p.categoryId?.toString() || '0',
                categoryName: p.category?.name || 'عام',
                img: p.imagePath ? p.imagePath : '📦',
                sellByWeight: p.sellByWeight,
                isUnit: false,
                factor: 1
            });

            // Advanced Units (Cartons, Dozens, etc.)
            if (p.productUnits && p.productUnits.length > 0) {
                p.productUnits.forEach((u: any) => {
                    flattenedProducts.push({
                        id: p.id.toString() + '-unit-' + u.id,
                        name: p.name + ' (' + (u.unit?.name || 'وحدة') + ')',
                        barcode: u.barcode,
                        price: u.sellPrice,
                        taxRate: p.taxRate,
                        stock: Math.floor(p.currentStock / (u.factor || 1)), // Virtual Stock
                        categoryId: p.categoryId?.toString() || '0',
                        categoryName: p.category?.name || 'عام',
                        img: p.imagePath ? p.imagePath : '📦',
                        sellByWeight: false,
                        isUnit: true,
                        factor: u.factor || 1
                    });
                });
            }
        });

        return NextResponse.json({
            success: true,
            products: flattenedProducts,
            categories: categories.map(c => ({
                id: c.id.toString(),
                name: c.name
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
