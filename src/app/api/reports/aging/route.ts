/**
 * Priority 3: Aging Report API
 * تقرير الذمم المدينة والدائنة حسب الأعمار الزمنية
 * الفئات: 0-30 يوم، 31-60، 61-90، +90 يوم
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const now = new Date();
    const bucket = (daysAgo: number) => {
        if (daysAgo <= 30) return '0-30';
        if (daysAgo <= 60) return '31-60';
        if (daysAgo <= 90) return '61-90';
        return '+90';
    };

    try {
        // ====== RECEIVABLES (مدينون - العملاء) ======
        const unpaidSales = await prisma.salesInvoice.findMany({
            where: { paymentType: 'credit' },
            select: {
                id: true,
                invoiceNo: true,
                date: true,
                total: true,
                customer: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { date: 'asc' },
        });

        const receivablesAging: Record<string, { count: number; total: number; items: any[] }> = {
            '0-30': { count: 0, total: 0, items: [] },
            '31-60': { count: 0, total: 0, items: [] },
            '61-90': { count: 0, total: 0, items: [] },
            '+90': { count: 0, total: 0, items: [] },
        };

        for (const inv of unpaidSales) {
            const days = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
            const b = bucket(days);
            receivablesAging[b].count++;
            receivablesAging[b].total += inv.total;
            receivablesAging[b].items.push({
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                customerName: inv.customer?.name || '—',
                customerPhone: inv.customer?.phone || '',
                amount: inv.total,
                daysOld: days,
                date: inv.date,
            });
        }

        // ====== PAYABLES (دائنون - الموردون) ======
        const unpaidPurchases = await prisma.purchaseInvoice.findMany({
            where: { paymentType: 'credit' },
            select: {
                id: true,
                invoiceNo: true,
                date: true,
                total: true,
                supplier: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { date: 'asc' },
        });

        const payablesAging: Record<string, { count: number; total: number; items: any[] }> = {
            '0-30': { count: 0, total: 0, items: [] },
            '31-60': { count: 0, total: 0, items: [] },
            '61-90': { count: 0, total: 0, items: [] },
            '+90': { count: 0, total: 0, items: [] },
        };

        for (const inv of unpaidPurchases) {
            const days = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
            const b = bucket(days);
            payablesAging[b].count++;
            payablesAging[b].total += inv.total;
            payablesAging[b].items.push({
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                supplierName: inv.supplier?.name || '—',
                supplierPhone: inv.supplier?.phone || '',
                amount: inv.total,
                daysOld: days,
                date: inv.date,
            });
        }

        // ====== INSTALLMENTS AGING ======
        // Installment model: remaining (Float), createdAt (DateTime), no dueDate/amount fields
        const overdueInstallments = await prisma.installment.findMany({
            where: {
                status: { in: ['active', 'overdue'] },
                remaining: { gt: 0 },
            },
            select: {
                id: true,
                createdAt: true,       // use createdAt (no dueDate field)
                remaining: true,       // use remaining (no amount field)
                customer: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const installmentAging: Record<string, { count: number; total: number }> = {
            '0-30': { count: 0, total: 0 },
            '31-60': { count: 0, total: 0 },
            '61-90': { count: 0, total: 0 },
            '+90': { count: 0, total: 0 },
        };

        for (const inst of overdueInstallments) {
            const days = Math.floor((now.getTime() - new Date(inst.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const b = bucket(days);
            installmentAging[b].count++;
            installmentAging[b].total += inst.remaining;   // use remaining not amount
        }

        const totalReceivables = Object.values(receivablesAging).reduce((s, b) => s + b.total, 0);
        const totalPayables = Object.values(payablesAging).reduce((s, b) => s + b.total, 0);
        const totalInstallmentsRemaining = Object.values(installmentAging).reduce((s, b) => s + b.total, 0);

        return NextResponse.json({
            generatedAt: now.toISOString(),
            summary: {
                totalReceivables: Math.round(totalReceivables * 100) / 100,
                totalPayables: Math.round(totalPayables * 100) / 100,
                netExposure: Math.round((totalReceivables - totalPayables) * 100) / 100,
                pendingInstallments: overdueInstallments.length,
                installmentsRemaining: Math.round(totalInstallmentsRemaining * 100) / 100,
            },
            receivables: receivablesAging,
            payables: payablesAging,
            installments: installmentAging,
        });
    } catch (e) {
        console.error('Aging report error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء تقرير الذمم' }, { status: 500 });
    }
}
