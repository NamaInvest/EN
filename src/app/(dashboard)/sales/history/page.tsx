import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import InvoiceClient from './InvoiceClient';

export const metadata: Metadata = {
    title: 'فواتير المبيعات | Sales Invoices',
    description: 'إدارة شبكة بيانات فواتير المبيعات',
};

// Next.js App Router Server Component
export default async function SalesInvoicesPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    // 1. Extract and sanitize search parameters (Server-Side Pagination)
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
    const pageSize = 20; // Hardcoded per wireframe (عرض [20▾]/صفحة)
    
    const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const date = typeof searchParams.date === 'string' ? searchParams.date : undefined;

    // 2. Build Prisma Where Clause dynamically
    const where: any = {
        deletedAt: null, // Don't show soft-deleted invoices
    };

    if (q) {
        // Search by invoiceNo (if numeric) or customer name
        const numQ = parseInt(q, 10);
        where.OR = [
            ...(isNaN(numQ) ? [] : [{ invoiceNo: numQ }]),
            { customer: { name: { contains: q, mode: 'insensitive' } } }
        ];
    }

    // 3. Status Mapping Logic (Simulated based on paymentType for ERPs)
    if (status === 'PAID') {
        where.paymentType = { in: ['cash', 'card', 'split'] };
    } else if (status === 'PENDING') {
        where.paymentType = { notIn: ['cash', 'card', 'split'] };
    }

    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        where.date = {
            gte: startOfDay,
            lte: endOfDay
        };
    }

    // 4. Execute queries in parallel using Promise.all for high performance
    const [invoices, totalCount] = await Promise.all([
        prisma.salesInvoice.findMany({
            where,
            orderBy: { id: 'desc' }, // Latest first
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                customer: {
                    select: { name: true, taxNumber: true }
                },
                details: true // Needed for reprint functionality
            }
        }),
        prisma.salesInvoice.count({ where })
    ]);

    // 5. Map Prisma model to standard UI interface
    const mappedInvoices = invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date.toISOString(),
        total: Number(inv.total || 0),
        paymentType: inv.paymentType || 'cash',
        customerName: inv.customer?.name || '',
        customerTaxNo: inv.customer?.taxNumber,
        details: inv.details || [],
        subtotal: Number(inv.subtotal || 0),
        discountValue: Number(inv.discountValue || 0),
        taxValue: Number(inv.taxValue || 0),
        status: (['cash', 'card', 'split'].includes(inv.paymentType?.toLowerCase()) ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
    }));

    return (
        <InvoiceClient 
            initialInvoices={mappedInvoices} 
            totalCount={totalCount} 
            currentPage={page} 
            pageSize={pageSize} 
        />
    );
}
