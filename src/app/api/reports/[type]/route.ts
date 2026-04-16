import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    try {
        const { type } = await params;
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request);
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
                    where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter },
                    include: { customer: { select: { id: true, name: true, phone: true,  } } },
                    orderBy: { date: 'desc' },
                });
                const totalSales = invoices.reduce((s, i) => s + i.total, 0);
                const totalTax = invoices.reduce((s, i) => s + i.taxValue, 0);
                return NextResponse.json({
                    summary: { 'إجمالي المبيعات': totalSales, 'الضريبة': totalTax, 'عدد الفواتير': invoices.length },
                    data: invoices.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('ar-SA'), 'العميل': (i as any).customer?.name || 'نقدي', 'الإجمالي': i.total, 'الحالة': i.status })),
                });
            }
            case 'purchases': {
                const invoices = await prisma.purchaseInvoice.findMany({
                    where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter },
                    include: { supplier: { select: { id: true, name: true, phone: true,  } } },
                    orderBy: { date: 'desc' },
                });
                const total = invoices.reduce((s, i) => s + i.total, 0);
                return NextResponse.json({
                    summary: { 'إجمالي المشتريات': total, 'عدد الفواتير': invoices.length },
                    data: invoices.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('ar-SA'), 'المورد': (i as any).supplier?.name || '-', 'الإجمالي': i.total })),
                });
            }
            case 'stock': {
                const products = await prisma.product.findMany({ where: { active: true }, include: { category: true, unit: true }, orderBy: { name: 'asc' } });
                const totalValue = products.reduce((s, p) => s + p.currentStock * p.buyPrice, 0);
                return NextResponse.json({
                    summary: { 'عدد المنتجات': products.length, 'قيمة المخزون': totalValue },
                    data: products.map(p => ({ 'المنتج': p.name, 'التصنيف': p.category?.name || '-', 'المخزون': p.currentStock, 'الوحدة': p.unit?.name || '', 'سعر الشراء': p.buyPrice, 'القيمة': p.currentStock * p.buyPrice })),
                });
            }
            case 'expenses': {
                const expenses = await prisma.expense.findMany({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, orderBy: { date: 'desc' } });
                const total = expenses.reduce((s, e) => s + e.amount, 0);
                return NextResponse.json({
                    summary: { 'إجمالي المصروفات': total, 'عدد العمليات': expenses.length },
                    data: expenses.map(e => ({ 'التاريخ': new Date(e.date).toLocaleDateString('ar-SA'), 'الفئة': e.category || '-', 'الوصف': e.description, 'المبلغ': e.amount })),
                });
            }
            case 'customers': {
                const customers = await prisma.customer.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
                const totalBalance = customers.reduce((s, c) => s + c.balance, 0);
                return NextResponse.json({
                    summary: { 'عدد العملاء': customers.filter(c => c.type === 0).length, 'عدد الموردين': customers.filter(c => c.type === 1).length, 'إجمالي الأرصدة': totalBalance },
                    data: customers.map(c => ({ 'الاسم': c.name, 'الهاتف': c.phone || '-', 'النوع': c.type === 0 ? 'عميل' : c.type === 1 ? 'مورد' : 'كلاهما', 'الرصيد': c.balance })),
                });
            }
            case 'profit': {
                const sales = await prisma.salesInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter, status: 'completed' }, _sum: { total: true, taxValue: true } });
                const purchases = await prisma.purchaseInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { total: true } });
                const expenses = await prisma.expense.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { amount: true } });
                const revenue = (sales._sum.total || 0) - (sales._sum.taxValue || 0);
                const cost = (purchases._sum.total || 0);
                const exp = expenses._sum.amount || 0;
                return NextResponse.json({
                    summary: { 'الإيرادات': revenue, 'تكلفة البضاعة': cost, 'المصروفات': exp, 'صافي الربح': revenue - cost - exp },
                    data: [],
                });
            }
            case 'tax': {
                const salesTax = await prisma.salesInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter, status: 'completed' }, _sum: { taxValue: true } });
                const purchasesTax = await prisma.purchaseInvoice.aggregate({ where: { ...(hasDate ? { date: dateFilter } : {}), ...branchFilter }, _sum: { taxValue: true } });
                const collected = salesTax._sum.taxValue || 0;
                const paid = purchasesTax._sum.taxValue || 0;
                return NextResponse.json({
                    summary: { 'ضريبة محصّلة': collected, 'ضريبة مدفوعة': paid, 'المستحق': collected - paid },
                    data: [],
                });
            }
            case 'users-list': {
                const users = await prisma.user.findMany({
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

                const sales = await prisma.salesInvoice.findMany({ where: dayWhere, include: { customer: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const purchases = await prisma.purchaseInvoice.findMany({ where: dayWhere, include: { supplier: { select: { id: true, name: true, phone: true,  } }, user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const expenses = await prisma.expense.findMany({ where: dayWhere, include: { user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const treasury = await prisma.treasury.findMany({ where: dayWhere, include: { user: { select: { fullName: true } } }, orderBy: { date: 'desc' } });
                const salesReturns = await prisma.salesReturn.findMany({ where: { ...(hasDayDate ? { date: dayDate } : {}), ...(userId && userId !== 'all' ? { userId: parseInt(userId) } : {}) }, orderBy: { date: 'desc' } });
                const purchaseReturns = await prisma.purchaseReturn.findMany({ where: { ...(hasDayDate ? { date: dayDate } : {}), ...(userId && userId !== 'all' ? { userId: parseInt(userId) } : {}) }, orderBy: { date: 'desc' } });

                const totalSales = sales.reduce((s, i) => s + i.total, 0);
                const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);
                const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
                const treasuryIn = treasury.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
                const treasuryOut = treasury.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
                const totalSalesReturns = salesReturns.reduce((s, r) => s + r.total, 0);
                const totalPurchaseReturns = purchaseReturns.reduce((s, r) => s + r.total, 0);

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
                    sales: sales.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('ar-SA'), 'الوقت': new Date(i.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), 'العميل': (i as any).customer?.name || 'نقدي', 'المستخدم': (i as any).user?.fullName || '-', 'الإجمالي': i.total, 'الدفع': i.paymentType === 'cash' ? 'نقدي' : 'آجل' })),
                    purchases: purchases.map(i => ({ '#': i.invoiceNo, 'التاريخ': new Date(i.date).toLocaleDateString('ar-SA'), 'الوقت': new Date(i.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), 'المورد': (i as any).supplier?.name || '-', 'المستخدم': (i as any).user?.fullName || '-', 'الإجمالي': i.total })),
                    expenses: expenses.map(e => ({ 'التاريخ': new Date(e.date).toLocaleDateString('ar-SA'), 'الفئة': e.category || '-', 'الوصف': e.description, 'المستخدم': (e as any).user?.fullName || '-', 'المبلغ': e.amount })),
                    treasury: treasury.map(t => ({ 'التاريخ': new Date(t.date).toLocaleDateString('ar-SA'), 'الوقت': new Date(t.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), 'النوع': t.type === 'in' ? 'وارد' : 'صادر', 'الوصف': t.description || '-', 'المستخدم': (t as any).user?.fullName || '-', 'المبلغ': t.amount })),
                    salesReturns: salesReturns.map(r => ({ '#': r.returnNo, 'التاريخ': new Date(r.date).toLocaleDateString('ar-SA'), 'الإجمالي': r.total })),
                    purchaseReturns: purchaseReturns.map(r => ({ '#': r.returnNo, 'التاريخ': new Date(r.date).toLocaleDateString('ar-SA'), 'الإجمالي': r.total })),
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
                        'التاريخ': new Date(m.date).toLocaleDateString('ar-SA'),
                        'الوقت': new Date(m.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        'ملاحظات': m.notes || '-',
                    })),
                });
            }
            case 'least-selling': {
                const days = parseInt(searchParams.get('days') || '30');
                const sinceDate = new Date();
                sinceDate.setDate(sinceDate.getDate() - days);

                // Get all active products
                const allProducts = await prisma.product.findMany({ where: { active: true }, select: { id: true, name: true, currentStock: true } });

                // Get sales quantities per product in the period
                const salesDetails = await prisma.salesInvoiceDetail.findMany({
                    where: { invoice: { date: { gte: sinceDate } } },
                    select: { productId: true, quantity: true },
                });

                // Aggregate sales by product
                const salesMap = new Map<number, { qty: number; count: number }>();
                for (const d of salesDetails) {
                    const entry = salesMap.get(d.productId) || { qty: 0, count: 0 };
                    entry.qty += d.quantity;
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
                const totalDiscount = invoices.reduce((s, i) => s + i.discountValue, 0);
                return NextResponse.json({
                    summary: { 'عدد الفواتير بتخفيض': invoices.length, 'إجمالي التخفيضات': totalDiscount },
                    data: invoices.map(i => ({
                        '#': i.invoiceNo,
                        'المستخدم': (i as any).user?.fullName || '-',
                        'العميل': (i as any).customer?.name || 'نقدي',
                        'نسبة التخفيض': `${i.discountRate}%`,
                        'قيمة التخفيض': i.discountValue,
                        'إجمالي الفاتورة': i.total,
                        'التاريخ': new Date(i.date).toLocaleDateString('ar-SA'),
                        'الوقت': new Date(i.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
                    })),
                });
            }
            default:
                return NextResponse.json({ summary: {}, data: [] });
        }
    } catch (error) {
        console.error('Report error:', error);
        return NextResponse.json({ summary: {}, data: [] }, { status: 500 });
    }
}
