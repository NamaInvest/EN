import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
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
                { barcode: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (catId && catId !== 'all') {
            whereClause.categoryId = parseInt(catId);
        }

        const [products, categories] = await Promise.all([
            prisma.product.findMany({
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
                    category: { select: { id: true, name: true } }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.category.findMany({
                orderBy: { name: 'asc' }
            })
        ]);

        return NextResponse.json({
            success: true,
            products: products.map(p => ({
                id: p.id.toString(),
                name: p.name,
                barcode: p.barcode,
                price: p.sellPrice,
                taxRate: p.taxRate,
                stock: p.currentStock,
                categoryId: p.categoryId?.toString() || '0',
                categoryName: p.category?.name || 'عام',
                img: p.imagePath ? p.imagePath : '📦', // Fallback icon
                sellByWeight: p.sellByWeight
            })),
            categories: categories.map(c => ({
                id: c.id.toString(),
                name: c.name
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
