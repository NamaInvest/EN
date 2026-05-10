import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'products.export' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const allowed = await hasPermission(auth.userId, 'dashboard', prisma); // Basically any product viewer
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } });

        const { searchParams } = new URL(request.url);
        const categoryFilter = searchParams.get('category_id');
        const includeInactive = searchParams.get('include_inactive') === 'true';

        const where: any = {};
        if (categoryFilter) where.categoryId = parseInt(categoryFilter);
        if (!includeInactive) where.active = true;

        const products = await prisma.product.findMany({
            take: 100,
            where,
            include: { category: true, unit: true },
            orderBy: { id: 'asc' }
        });

        const exportData = products.map(p => ({
            'المعرف (لا تقم بتعديله)': p.id,
            'الباركود': p.barcode || '',
            'اسم المنتج': p.name,
            'الاسم الإنجليزي': p.nameEn || '',
            'سعر الشراء': p.buyPrice,
            'سعر البيع': p.sellPrice,
            'نسبة الضريبة': p.taxRate,
            'المخزون الحالي': p.currentStock,
            'الحد الأدنى': p.minQuantity,
            'معرف التصنيف': p.categoryId || '',
            'اسم التصنيف': p.category?.name || '',
            'الوصف': p.description || '',
            'نشط (1/0)': p.active ? 1 : 0
        }));

        const ws = xlsx.utils.json_to_sheet(exportData);
        
        // Auto-size columns slightly
        const colWidths = [
            { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, 
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
            { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }
        ];
        ws['!cols'] = colWidths;

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Products Export");

        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });

    } catch (error: any) {
        log.error('Products EXPORT error:', error);
        return NextResponse.json({ error: 'فشل في تصدير المنتجات' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
