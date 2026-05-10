import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reports.customer-statement' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const customerId = parseInt(url.searchParams.get('customerId') || '0');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        if (!customerId) {
            return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 1. Get Opening Balance (transactions before 'from' date)
        let openingBalance = 0;
        if (from) {
            const fromDate = new Date(from);
            const prevInvoices = await prisma.salesInvoice.aggregate({
                _sum: { total: true },
                where: { customerId, date: { lt: fromDate }, status: { not: 'DRAFT' } }
            });
            const prevPayments = await prisma.treasury.aggregate({
                _sum: { amount: true },
                where: { referenceType: 'CUSTOMER', referenceId: customerId, type: 'in', date: { lt: fromDate } }
            });
            openingBalance = n(prevInvoices._sum?.total) - n(prevPayments._sum?.amount);
        }

        // 2. Get period transactions
        const whereInvoices: any = { customerId, status: { not: 'DRAFT' } };
        const wherePayments: any = { referenceType: 'CUSTOMER', referenceId: customerId, type: 'in' };
        
        if (from || to) {
            whereInvoices.date = {};
            wherePayments.date = {};
            if (from) {
                whereInvoices.date.gte = new Date(from);
                wherePayments.date.gte = new Date(from);
            }
            if (to) {
                whereInvoices.date.lte = new Date(to + 'T23:59:59');
                wherePayments.date.lte = new Date(to + 'T23:59:59');
            }
        }

        const invoices = await prisma.salesInvoice.findMany({ take: 100,
            where: whereInvoices,
            select: { id: true, invoiceNo: true, date: true, total: true }
        });

        const payments = await prisma.treasury.findMany({ take: 100,
            where: wherePayments,
            select: { id: true, date: true, amount: true, description: true }
        });

        // 3. Combine and sort
        const transactions: any[] = [];
        invoices.forEach(inv => {
            transactions.push({
                type: 'INVOICE',
                ref: 'INV-' + inv.invoiceNo,
                date: inv.date,
                debit: inv.total, // Increases balance
                credit: 0,
                description: 'فاتورة مبيعات'
            });
        });

        payments.forEach(pay => {
            transactions.push({
                type: 'PAYMENT',
                ref: 'PAY-' + pay.id,
                date: pay.date,
                debit: 0,
                credit: pay.amount, // Decreases balance
                description: pay.description || 'سداد دفعة / سند قبض'
            });
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calculate running balance
        let runningBalance = openingBalance;
        const statementLines = transactions.map(t => {
            runningBalance += (t.debit - t.credit);
            return { ...t, balance: runningBalance };
        });

        // 5. Aging
        const now = new Date();
        const aging = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const openInvoices = await prisma.salesInvoice.findMany({ take: 100,
            where: { customerId, remaining: { gt: 0 } },
            select: { remaining: true, date: true }
        });

        openInvoices.forEach(inv => {
            const days = Math.floor((now.getTime() - inv.date.getTime()) / (1000 * 3600 * 24));
            if (days <= 0) aging.current += n(inv.remaining);
            else if (days <= 30) aging['1-30'] += n(inv.remaining);
            else if (days <= 60) aging['31-60'] += n(inv.remaining);
            else if (days <= 90) aging['61-90'] += n(inv.remaining);
            else aging['90+'] += n(inv.remaining);
        });

        return NextResponse.json({
            customer: { id: customer.id, name: customer.name, phone: customer.phone, taxNumber: customer.taxNumber },
            openingBalance,
            closingBalance: runningBalance,
            transactions: statementLines,
            aging
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
