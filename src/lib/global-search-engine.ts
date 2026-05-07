/**
 * Global Search Engine
 * Searches across all major entities: customers, products, invoices, employees, orders
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

export interface SearchResult {
    type: 'customer' | 'supplier' | 'product' | 'invoice' | 'employee' | 'order' | 'page';
    id: number | string;
    title: string;
    subtitle?: string;
    href: string;
    icon: string;
}

const PAGES = [
    { title: 'Dashboard', titleAr: 'لوحة التحكم', href: '/', icon: '📊' },
    { title: 'Sales Invoices', titleAr: 'فواتير المبيعات', href: '/sales/invoices', icon: '🧾' },
    { title: 'Purchase Orders', titleAr: 'أوامر الشراء', href: '/purchases/orders', icon: '📋' },
    { title: 'Products', titleAr: 'المنتجات', href: '/products', icon: '📦' },
    { title: 'Customers', titleAr: 'العملاء', href: '/customers', icon: '👥' },
    { title: 'Employees', titleAr: 'الموظفين', href: '/hr', icon: '👨‍💼' },
    { title: 'Inventory', titleAr: 'المخزون', href: '/inventory', icon: '🏭' },
    { title: 'Accounting', titleAr: 'المحاسبة', href: '/accounting', icon: '💰' },
    { title: 'Reports', titleAr: 'التقارير', href: '/reports', icon: '📈' },
    { title: 'Settings', titleAr: 'الإعدادات', href: '/settings', icon: '⚙️' },
    { title: 'Calendar', titleAr: 'التقويم', href: '/calendar', icon: '📅' },
    { title: 'Contracts', titleAr: 'العقود', href: '/contracts', icon: '📄' },
    { title: 'Fleet', titleAr: 'الأسطول', href: '/fleet', icon: '🚛' },
    { title: 'Quality', titleAr: 'الجودة', href: '/manufacturing/quality', icon: '🔍' },
    { title: 'Workflow Builder', titleAr: 'مصمم سير العمل', href: '/settings/workflow-builder', icon: '⚙️' },
    { title: 'Bank Reconciliation', titleAr: 'تسوية البنك', href: '/accounting/bank-reconciliation', icon: '🏦' },
    { title: 'Aging Report', titleAr: 'تقادم الديون', href: '/reports/aging', icon: '📊' },
    { title: 'Pivot Table', titleAr: 'جدول محوري', href: '/reports/pivot', icon: '📊' },
    { title: 'DMS', titleAr: 'إدارة المستندات', href: '/dms', icon: '📁' },
    { title: 'Payroll', titleAr: 'الرواتب', href: '/hr/payroll-process', icon: '💵' },
    { title: 'Timesheet', titleAr: 'سجل الدوام', href: '/hr/timesheet', icon: '⏱️' },
    { title: 'Recruitment', titleAr: 'التوظيف', href: '/hr/recruitment', icon: '👔' },
];

export class GlobalSearchEngine {
    static async search(prisma: PrismaClient, query: string, lang: string = 'ar'): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];
        const results: SearchResult[] = [];
        const q = query.toLowerCase();

        // 1. Pages
        const matchedPages = PAGES.filter(pg =>
            pg.title.toLowerCase().includes(q) || pg.titleAr.includes(query) || pg.href.includes(q)
        ).slice(0, 5).map(pg => ({
            type: 'page' as const, id: pg.href, title: lang === 'ar' ? pg.titleAr : pg.title,
            subtitle: pg.href, href: pg.href, icon: pg.icon
        }));
        results.push(...matchedPages);

        // 2. Customers & Suppliers
        try {
            const parties = await p(prisma).party?.findMany?.({
                where: { OR: [{ name: { contains: query } }, { phone: { contains: query } }, { code: { contains: query } }] },
                take: 5, select: { id: true, name: true, phone: true, type: true, code: true }
            }) || [];
            for (const pr of parties) {
                results.push({
                    type: pr.type === 'supplier' ? 'supplier' : 'customer',
                    id: pr.id, title: pr.name || '', subtitle: pr.phone || pr.code || '',
                    href: pr.type === 'supplier' ? `/purchases?supplier=${pr.id}` : `/customers?id=${pr.id}`,
                    icon: pr.type === 'supplier' ? '🏪' : '👤'
                });
            }
        } catch {}

        // 3. Products
        try {
            const products = await p(prisma).product?.findMany?.({
                where: { OR: [{ name: { contains: query } }, { barcode: { contains: query } }, { sku: { contains: query } }] },
                take: 5, select: { id: true, name: true, sku: true, barcode: true }
            }) || [];
            for (const pr of products) {
                results.push({
                    type: 'product', id: pr.id, title: pr.name || '',
                    subtitle: pr.sku || pr.barcode || '', href: `/products/${pr.id}`, icon: '📦'
                });
            }
        } catch {}

        // 4. Invoices
        try {
            const invoices = await p(prisma).salesInvoice?.findMany?.({
                where: { OR: [{ invoiceNumber: { contains: query } }] },
                take: 5, select: { id: true, invoiceNumber: true, total: true, createdAt: true }
            }) || [];
            for (const inv of invoices) {
                results.push({
                    type: 'invoice', id: inv.id, title: `#${inv.invoiceNumber || inv.id}`,
                    subtitle: `${inv.total || 0} SAR`, href: `/sales/invoices?id=${inv.id}`, icon: '🧾'
                });
            }
        } catch {}

        // 5. Employees
        try {
            const emps = await p(prisma).employee?.findMany?.({
                where: { OR: [{ name: { contains: query } }, { employeeId: { contains: query } }] },
                take: 5, select: { id: true, name: true, employeeId: true, department: true }
            }) || [];
            for (const emp of emps) {
                results.push({
                    type: 'employee', id: emp.id, title: emp.name || '',
                    subtitle: emp.department || emp.employeeId || '', href: `/hr?id=${emp.id}`, icon: '👨‍💼'
                });
            }
        } catch {}

        return results.slice(0, 20);
    }
}
