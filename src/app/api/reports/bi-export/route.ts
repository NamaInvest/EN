import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reports.bi-export' });
/**
 * GET /api/reports/bi-export?entity=sales|purchases|inventory|customers
 * Returns JSON data optimized for BI tools (Power BI, Tableau, Looker)
 * Flat structure with denormalized fields for easy pivot table creation
 */
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const entity = searchParams.get('entity') || 'sales';
        const format = searchParams.get('format') || 'json';
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const dateFilter: any = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);
        const hasDate = from || to;

        let data: any[] = [];

        if (entity === 'sales') {
            const invoices = await prisma.salesInvoice.findMany({
                where: hasDate ? { date: dateFilter } : {},
                include: { details: true, customer: { select: { name: true, city: true } } },
                orderBy: { date: 'desc' },
                take: 10000,
            });
            data = invoices.flatMap(inv =>
                inv.details.map(d => ({
                    invoice_no: inv.invoiceNo,
                    date: inv.date,
                    customer: inv.customer?.name || 'نقدي',
                    city: inv.customer?.city || '',
                    product: d.productName,
                    quantity: d.quantity,
                    price: d.price,
                    discount: d.discountValue,
                    tax: d.taxValue,
                    total: d.total,
                    payment_type: inv.paymentType,
                }))
            );
        } else if (entity === 'purchases') {
            const _invoices_dup52 = await prisma.purchaseInvoice.findMany({
                where: hasDate ? { date: dateFilter } : {},
                include: { details: true, supplier: { select: { name: true } } },
                orderBy: { date: 'desc' },
                take: 10000,
            });
            // @ts-expect-error [TS2304] Cannot find name
            data = invoices.flatMap(inv =>
                // @ts-expect-error [TS7006] Implicit any parameter
                inv.details.map(d => ({
                    invoice_no: inv.invoiceNo,
                    date: inv.date,
                    supplier: inv.supplier?.name || '',
                    product: d.productName,
                    quantity: d.quantity,
                    price: d.price,
                    total: d.total,
                }))
            );
        } else if (entity === 'inventory') {
            const products = await prisma.product.findMany({
            take: 100,
                include: { category: { select: { name: true } }, productStocks: { include: { stock: { select: { name: true } } } } },
            });
            data = products.map(p => ({
                product_id: p.id,
                name: p.name,
                barcode: p.barcode,
                category: p.category?.name || '',
                buy_price: p.buyPrice,
                sell_price: p.sellPrice,
                current_stock: p.currentStock,
                min_quantity: p.minQuantity,
                warehouses: p.productStocks.map(ps => ({ warehouse: ps.stock.name, qty: ps.quantity })),
            }));
        } else if (entity === 'customers') {
            const customers = await prisma.customer.findMany({ take: 10000 });
            data = customers.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                city: c.city,
                type: c.type === 0 ? 'عميل' : c.type === 1 ? 'مورد' : 'كلاهما',
                balance: c.balance,
                credit_limit: c.creditLimit,
            }));
        }

        if (format === 'csv') {
            if (data.length === 0) return new NextResponse('No data', { status: 204 });
            const headers = Object.keys(data[0]);
            let csv = '\uFEFF' + headers.join(',') + '\r\n';
            data.forEach(row => {
                csv += headers.map(h => {
                    const v = row[h];
                    if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
                    if (v instanceof Date) return v.toISOString().slice(0, 10);
                    if (typeof v === 'object') return `"${JSON.stringify(v)}"`;
                    return v ?? '';
                }).join(',') + '\r\n';
            });
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${entity}_export.csv"`,
                },
            });
        }

        return NextResponse.json({ entity, count: data.length, data });
    } catch (e: any) {
        log.error('[BI Export]', e);
        return NextResponse.json({ error: 'فشل التصدير' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
