import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'public.menu' });

// Public API - no auth required
async function _GET(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        
        // Get company info for header
        const settings = await prisma.setting.findMany({
            take: 100,
            where: { key: { in: ['company_name', 'company_logo', 'tax_rate'] } }
        });
        const s: Record<string, string> = {};
        settings.forEach((st: any) => { s[st.key] = st.value ?? ''; });

        // Get all active products with categories
        const products = await prisma.product.findMany({
            take: 100,
            where: { active: true },
            select: { id: true, name: true, sellPrice: true, currentStock: true, imagePath: true, categoryId: true, category: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' }
        });

        const categories = await prisma.category.findMany({
            take: 100, orderBy: { name: 'asc' } });

        return NextResponse.json({
            success: true,
            companyName: s['company_name'] || 'المطعم',
            logo: s['company_logo'] || '',
            taxRate: Number(s['tax_rate']) || 15,
            products: products.map(p => ({
                id: p.id, name: p.name, price: p.sellPrice,
                stock: p.currentStock, img: p.imagePath,
                categoryId: p.categoryId, categoryName: (p as any).category?.name
            })),
            categories: categories.map(c => ({ id: c.id, name: c.name }))
        });
    } catch (e: any) {
        log.error('Public menu error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
