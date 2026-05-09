import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const { type } = await params;
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const dateFilter: Record<string, unknown> = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to + 'T23:59:59');
        const hasDate = Object.keys(dateFilter).length > 0;

        const branchFilter: Record<string, unknown> = {};
        if (user && user.role !== 'admin' && user.branchId) {
            branchFilter.branchId = user.branchId;
        } else if (branchQuery) {
            branchFilter.branchId = parseInt(branchQuery);
        }

        switch (type) {
            case 'sales': {
                const invoices = await prisma.salesInvoice.findMany({
            take: 100,
                    where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter },
                    include: { customer: { select: { id: true, name: true, phone: true,  } } },
                    orderBy: { date: 'desc' },
                });
                const totalSales = invoices.reduce((s: number, i: any) => s + n(i.total), 0);
                const totalTax = invoices.reduce((s: number, i: any) => s + n(i.taxValue), 0);
                return NextResponse.json({
                    summary: { 'إجمالي المبيعات': totalSales, 'الضريبة': totalTax, 'عدد الفواتير': invoices.length },
                    data: invoices.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('en-GB'), 'العميل': (i as any).customer?.name || 'نقدي', 'الإجمالي': i.total, 'الحالة': i.status })),
                });
            }
            case 'purchases': {
                const invoices = await prisma.purchaseInvoice.findMany({
            take: 100,
                    where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter },
                    include: { supplier: { select: { id: true, name: true, phone: true,  } } },
                    orderBy: { date: 'desc' },
                });
                const total = invoices.reduce((s: number, i: any) => s + n(i.total), 0);
                return NextResponse.json({
                    summary: { 'إجمالي المشتريات': total, 'عدد الفواتير': invoices.length },
                    data: invoices.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('en-GB'), 'المورد': (i as any).supplier?.name || '-', 'الإجمالي': i.total })),
                });
            }
            case 'stock': {
                const products = await prisma.product.findMany({
            take: 100, where: { active: true }, include: { category: true, unit: true }, orderBy: { name: 'asc' } });
                const totalValue = products.reduce((s: number, p: any) => s + n(p.currentStock) * n(p.buyPrice), 0);
                return NextResponse.json({
                    summary: { 'عدد المنتجات': products.length, 'قيمة المخزون': totalValue },
                    data: products.map(p => ({ 'المنتج': p.name, 'التصنيف': p.category?.name || '-', 'المخزون': n(p.currentStock), 'الوحدة': p.unit?.name || '', 'سعر الشراء': n(p.buyPrice), 'القيمة': n(p.currentStock) * n(p.buyPrice) })),
                });
            }
            case 'expenses': {
                const expenses = await prisma.expense.findMany({
            take: 100, where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, orderBy: { date: 'desc' } });
                const total = expenses.reduce((s: number, e: any) => s + n(e.amount), 0);
                return NextResponse.json({
                    summary: { 'إجمالي المصروفات': total, 'عدد العمليات': expenses.length },
                    data: expenses.map(e => ({ 'التاريخ': new Date(e.date).toLocaleDateString('en-GB'), 'الفئة': e.category || '-', 'الوصف': e.description, 'المبلغ': e.amount })),
                });
            }
            case 'customers': {
                const customers = await prisma.customer.findMany({
            take: 100, where: { active: true }, orderBy: { name: 'asc' } });
                const totalBalance = customers.reduce((s: number, c: any) => s + n(c.balance), 0);
                return NextResponse.json({
                    summary: { 'عدد العملاء': customers.filter(c => c.type === 0).length, 'عدد الموردين': customers.filter(c => c.type === 1).length, 'إجمالي الأرصدة': totalBalance },
                    data: customers.map(c => ({ 'الاسم': c.name, 'الهاتف': c.phone || '-', 'النوع': c.type === 0 ? 'عميل' : c.type === 1 ? 'مورد' : 'كلاهما', 'الرصيد': c.balance })),
                });
            }
            case 'profit': {
                const sales = await prisma.salesInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter, status: 'completed' }, _sum: { total: true, taxValue: true } });
                const purchases = await prisma.purchaseInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { total: true } });
                const expenses = await prisma.expense.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { amount: true } });
                const revenue = n(sales._sum.total) - n(sales._sum.taxValue);
                const cost = n(purchases._sum.total);
                const exp = n(expenses._sum.amount);
                return NextResponse.json({
                    summary: { 'الإيرادات': revenue, 'تكلفة البضاعة': cost, 'المصروفات': exp, 'صافي الربح': revenue - cost - exp },
                    data: [],
                });
            }
            case 'tax': {
                const salesTax = await prisma.salesInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter, status: 'completed' }, _sum: { taxValue: true } });
                const purchasesTax = await prisma.purchaseInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { taxValue: true } });
                const collected = n(salesTax._sum.taxValue);
                const paid = n(purchasesTax._sum.taxValue);
                return NextResponse.json({
                    summary: { 'ضريبة محصّلة': collected, 'ضريبة مدفوعة': paid, 'المستحق': collected - paid },
                    data: [],
                });
            }
            case 'users-list': {
                const users = await prisma.user.findMany({
            take: 100,
                    where: { active: true },
                    select: { id: true, fullName: true, role: true },
                    orderBy: { fullName: 'asc' },
                });
                return NextResponse.json(users);
            }
            case 'daily-report': {
                const userId = searchParams.get('userId');
                const userFilter: Record<string, unknown> = {};
                if (userId && userId !== 'all') userFilter.userId = parseInt(userId);

                // Use from as single-day date if no 'to'
                const dayDate: Record<string, unknown> = {};
                if (from) {
                    dayDate.gte = new Date(from);
                    dayDate.lte = new Date((to || from) + 'T23:59:59');
                } else if (hasDate) {
                    Object.assign(dayDate, dateFilter);
                }
                const hasDayDate = Object.keys(dayDate).length > 0;
                const dayWhere = { ...(hasDayDate ? { date: dayDate } : {}), ...userFilter, ...branchFilter };

                const sales = await prisma.salesInvoice.findMany({
            take: 100, where: dayWhere, include: { customer: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const purchases = await prisma.purchaseInvoice.findMany({
            take: 100, where: dayWhere, include: { supplier: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const expenses = await prisma.expense.findMany({
            take: 100, where: dayWhere, include: { user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const treasury = await prisma.treasury.findMany({
            take: 100, where: dayWhere, include: { user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const salesReturns = await prisma.salesReturn.findMany({
            take: 100, where: { ...(hasDayDate ? { date: dayDate } : {}), ...(userId && userId !== 'all' ? { userId: parseInt(userId) } : {}) }, orderBy: { date: 'desc' } });
                const purchaseReturns = await prisma.purchaseReturn.findMany({
            take: 100, where: { ...(hasDayDate ? { date: dayDate } : {}), ...(userId && userId !== 'all' ? { userId: parseInt(userId) } : {}) }, orderBy: { date: 'desc' } });

                const totalSales = sales.reduce((s: number, i: any) => s + n(i.total), 0);
                const totalPurchases = purchases.reduce((s: number, i: any) => s + n(i.total), 0);
                const totalExpenses = expenses.reduce((s: number, e: any) => s + n(e.amount), 0);
                const treasuryIn = treasury.filter(t => t.type === 'in').reduce((s: number, t: any) => s + n(t.amount), 0);
                const treasuryOut = treasury.filter(t => t.type === 'out').reduce((s: number, t: any) => s + n(t.amount), 0);
                const totalSalesReturns = salesReturns.reduce((s: number, r: any) => s + n(r.total), 0);
                const totalPurchaseReturns = purchaseReturns.reduce((s: number, r: any) => s + n(r.total), 0);

                return NextResponse.json({
                    summary: {
                        'إجمالي المبيعات': totalSales,
                        'إجمالي المشتريات': totalPurchases,
                        'المصروفات': totalExpenses,
                        'الخزينة (وارد)': treasuryIn,
                        'الخزينة (صادر)': treasuryOut,
                        'مرتجعات المبيعات': totalSalesReturns,
                        'مرتجعات المشتريات': totalPurchaseReturns,
                    },
                    sales: sales.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('en-GB'), 'الوقت': new Date(i.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 'العميل': (i as any).customer?.name || 'نقدي', 'المستخدم': (i as any).user?.fullName || '-', 'الإجمالي': i.total, 'الدفع': i.paymentType === 'cash' ? 'نقدي' : 'آجل' })),
                    purchases: purchases.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('en-GB'), 'الوقت': new Date(i.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 'المورد': (i as any).supplier?.name || '-', 'المستخدم': (i as any).user?.fullName || '-', 'الإجمالي': i.total })),
                    expenses: expenses.map(e => ({ 'التاريخ': new Date(e.date).toLocaleDateString('en-GB'), 'الفئة': e.category || '-', 'الوصف': e.description, 'المستخدم': (e as any).user?.fullName || '-', 'المبلغ': e.amount })),
                    treasury: treasury.map(t => ({ 'التاريخ': new Date(t.date).toLocaleDateString('en-GB'), 'الوقت': new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 'النوع': t.type === 'in' ? 'وارد' : 'صادر', 'الوصف': t.description || '-', 'المستخدم': (t as any).user?.fullName || '-', 'المبلغ': t.amount })),
                    salesReturns: salesReturns.map(r => ({ '#': r.returnNo, 'التاريخ': new Date(r.date).toLocaleDateString('en-GB'), 'الإجمالي': r.total })),
                    purchaseReturns: purchaseReturns.map(r => ({ '#': r.returnNo, 'التاريخ': new Date(r.date).toLocaleDateString('en-GB'), 'الإجمالي': r.total })),
                });
            }
            case 'stock-audit': {
                const userId = searchParams.get('userId');
                const where: Record<string, unknown> = {};
                if (hasDate) where.date = dateFilter;
                if (userId && userId !== 'all') where.userId = parseInt(userId);

                const movements = await prisma.stockMovement.findMany({
                    where,
                    include: { product: { select: { name: true } }, user: { select: { fullName: true } }, stock: { select: { name: true } } },
                    orderBy: { date: 'desc' },
                    take: 500,
                });
                const typeLabels: Record<string, string> = { in: 'إدخال', out: 'إخراج', adjustment: 'تعديل', transfer: 'تحويل' };
                return NextResponse.json({
                    summary: { 'عدد الحركات': movements.length, 'إدخال': movements.filter(m => m.type === 'in').length, 'إخراج': movements.filter(m => m.type === 'out').length, 'تعديل': movements.filter(m => m.type === 'adjustment').length },
                    data: movements.map(m => ({
                        'المنتج': (m as any).product?.name || '-',
                        'المستخدم': (m as any).user?.fullName || '-',
                        'النوع': typeLabels[m.type] || m.type,
                        'الكمية': m.quantity,
                        'المخزن': (m as any).stock?.name || '-',
                        'التاريخ': new Date(m.date).toLocaleDateString('en-GB'),
                        'الوقت': new Date(m.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        'ملاحظات': m.notes || '-',
                    })),
                });
            }
            case 'least-selling': {
                const days = parseInt(searchParams.get('days') || '30');
                const sinceDate = new Date();
                sinceDate.setDate(sinceDate.getDate() - days);

                // Get all active products
                const allProducts = await prisma.product.findMany({
            take: 100, where: { active: true }, select: { id: true, name: true, currentStock: true } });

                // Get sales quantities per product in the period
                const salesDetails = await prisma.salesInvoiceDetail.findMany({
            take: 100,
                    where: { invoice: { date: { gte: sinceDate } } },
                    select: { productId: true, quantity: true },
                });

                // Aggregate sales by product
                const salesMap = new Map<number, { qty: number; count: number }>();
                for (const d of salesDetails) {
                    const entry = salesMap.get(d.productId) || { qty: 0, count: 0 };
                    entry.qty += n(d.quantity);
                    entry.count += 1;
                    salesMap.set(d.productId, entry);
                }

                // Build list with all products, sorted by qty ASC (least selling first)
                const list = allProducts.map(p => ({
                    'المنتج': p.name,
                    'المخزون الحالي': p.currentStock,
                    'الكمية المباعة': salesMap.get(p.id)?.qty || 0,
                    'عدد مرات البيع': salesMap.get(p.id)?.count || 0,
                })).sort((a, b) => a['الكمية المباعة'] - b['الكمية المباعة']).slice(0, 20);

                return NextResponse.json({
                    summary: { 'الفترة': `${days} يوم`, 'عدد المنتجات': allProducts.length, 'منتجات بدون مبيعات': allProducts.filter(p => !salesMap.has(p.id)).length },
                    data: list,
                });
            }
            case 'discounts-audit': {
                const userId = searchParams.get('userId');
                const where: Record<string, unknown> = { discountValue: { gt: 0 }, ...branchFilter };
                if (hasDate) where.date = dateFilter;
                if (userId && userId !== 'all') where.userId = parseInt(userId);

                const invoices = await prisma.salesInvoice.findMany({
                    where,
                    include: { customer: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } },
                    orderBy: { date: 'desc' },
                    take: 500,
                });
                const totalDiscount = invoices.reduce((s: number, i: any) => s + n(i.discountValue), 0);
                return NextResponse.json({
                    summary: { 'عدد الفواتير بتخفيض': invoices.length, 'إجمالي التخفيضات': totalDiscount },
                    data: invoices.map(i => ({
                        '#': i.invoiceNo,
                        'المستخدم': (i as any).user?.fullName || '-',
                        'العميل': (i as any).customer?.name || 'نقدي',
                        'نسبة التخفيض': `${i.discountRate}%`,
                        'قيمة التخفيض': i.discountValue,
                        'إجمالي الفاتورة': i.total,
                        'التاريخ': new Date(i.date).toLocaleDateString('en-GB'),
                        'الوقت': new Date(i.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    })),
                });
            }
            default:
                return NextResponse.json({ summary: {}, data: [] });
        }
    } catch (error: any) {
        console.error('Report error:', error);
        return NextResponse.json({ summary: {}, data: [] }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
