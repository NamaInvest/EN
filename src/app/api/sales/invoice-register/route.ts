import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { hasPermission } from '@/lib/auth';

export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const zatcaStatus = searchParams.get('zatcaStatus') || undefined;
    const customerId = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : undefined;
    const branchId = searchParams.get('branchId') ? parseInt(searchParams.get('branchId')!) : undefined;
    const createdById = searchParams.get('createdById') ? parseInt(searchParams.get('createdById')!) : undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const sourceQuotationId = searchParams.get('sourceQuotationId') ? parseInt(searchParams.get('sourceQuotationId')!) : undefined;
    const invoiceType = searchParams.get('invoiceType') || undefined;
    
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')! + 'T23:59:59') : undefined;
    
    const dueDateFrom = searchParams.get('dueDateFrom') ? new Date(searchParams.get('dueDateFrom')!) : undefined;
    const dueDateTo = searchParams.get('dueDateTo') ? new Date(searchParams.get('dueDateTo')! + 'T23:59:59') : undefined;
    
    const minTotal = searchParams.get('minTotal') ? parseFloat(searchParams.get('minTotal')!) : undefined;
    const maxTotal = searchParams.get('maxTotal') ? parseFloat(searchParams.get('maxTotal')!) : undefined;
    
    const minBalance = searchParams.get('minBalance') ? parseFloat(searchParams.get('minBalance')!) : undefined;
    const maxBalance = searchParams.get('maxBalance') ? parseFloat(searchParams.get('maxBalance')!) : undefined;
    
    const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : undefined;
    const taxNumber = searchParams.get('taxNumber') || undefined;

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortDir = searchParams.get('sortDir') || 'desc';

    // Verify sub-permission for exporting
    const isExportRequest = searchParams.get('export') === 'true';
    if (isExportRequest) {
      const allowedExport = await hasPermission(auth.userId, 'sales.invoice_register.export', prisma);
      if (!allowedExport) {
        return NextResponse.json({ error: 'Forbidden', message: 'صلاحيات غير كافية للتصدير' }, { status: 403 });
      }
    }

    // Build Prisma where clause
    const where: any = {
      tenantId: tenant,
      deletedAt: null, // Don't show soft-deleted invoices
    };

    // General text search
    if (q) {
      const numQ = parseInt(q, 10);
      where.OR = [
        ...(!isNaN(numQ) ? [{ invoiceNo: numQ }] : []),
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
        { customer: { taxNumber: { contains: q, mode: 'insensitive' } } },
        { notes: { contains: q, mode: 'insensitive' } },
        { salesQuotation: { quotationNo: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Payment Status filter (unpaid, partially_paid, paid, overdue)
    if (paymentStatus) {
      const now = new Date();
      if (paymentStatus === 'unpaid') {
        where.paid = 0;
      } else if (paymentStatus === 'partially_paid') {
        where.paid = { gt: 0 };
        where.remaining = { gt: 0 };
      } else if (paymentStatus === 'paid') {
        where.remaining = 0;
      } else if (paymentStatus === 'overdue') {
        where.remaining = { gt: 0 };
        // Assuming default 30 days credit terms
        where.date = { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // ZATCA status
    if (zatcaStatus) {
      where.zatcaStatus = zatcaStatus;
    }

    // Customer / Branch / Creator User filters
    if (customerId) {
      where.customerId = customerId;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (createdById) {
      where.userId = createdById;
    }

    // Source Type (manual, quotation, pos)
    if (sourceType) {
      if (sourceType === 'manual') {
        where.salesQuotation = null;
      } else if (sourceType === 'quotation') {
        where.salesQuotation = { isNot: null };
      } else if (sourceType === 'pos') {
        where.shiftId = { not: null };
      }
    }

    if (sourceQuotationId) {
      where.salesQuotation = { id: sourceQuotationId };
    }

    // Document Type (tax_invoice, simplified, credit_note, debit_note)
    if (invoiceType) {
      if (invoiceType === 'tax_invoice') {
        where.docType = 'invoice';
      } else if (invoiceType === 'simplified') {
        where.docType = 'simplified';
      } else if (invoiceType === 'credit_note') {
        where.docType = { in: ['credit', 'simplified_credit', 'standard_credit'] };
      } else if (invoiceType === 'debit_note') {
        where.docType = { in: ['debit', 'simplified_debit', 'standard_debit'] };
      }
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    // Due Date filters (calculated as date + 30 days offset)
    if (dueDateFrom || dueDateTo) {
      where.date = where.date || {};
      const offset = 30 * 24 * 60 * 60 * 1000;
      if (dueDateFrom) {
        where.date.gte = new Date(dueDateFrom.getTime() - offset);
      }
      if (dueDateTo) {
        where.date.lte = new Date(dueDateTo.getTime() - offset);
      }
    }

    // Amount total filters
    if (minTotal !== undefined || maxTotal !== undefined) {
      where.total = {};
      if (minTotal !== undefined) where.total.gte = minTotal;
      if (maxTotal !== undefined) where.total.lte = maxTotal;
    }

    // Balance remaining filters
    if (minBalance !== undefined || maxBalance !== undefined) {
      where.remaining = {};
      if (minBalance !== undefined) where.remaining.gte = minBalance;
      if (maxBalance !== undefined) where.remaining.lte = maxBalance;
    }

    // Product filter within details
    if (productId) {
      where.details = {
        some: {
          productId: productId,
        }
      };
    }

    // Customer tax number filter
    if (taxNumber) {
      where.customer = {
        taxNumber: taxNumber,
      };
    }

    // Determine sorting fields mapping
    let orderField = sortBy;
    if (sortBy === 'customerName') {
      orderField = 'customerId'; // Fallback mapping for prisma sorting
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute database operations in parallel for high performance
    const [invoices, totalCount, aggregates] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderField]: sortDir,
        },
        include: {
          customer: true,
          branch: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            }
          },
          salesQuotation: {
            select: {
              id: true,
              quotationNo: true,
            }
          }
        }
      }),
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: {
          subtotal: true,
          taxValue: true,
          total: true,
          paid: true,
          remaining: true,
        }
      })
    ]);

    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val.toNumber === 'function') return val.toNumber();
      return Number(val);
    };

    // Format aggregate values safely
    const totals = {
      totalInvoices: totalCount,
      subtotalSum: toNum(aggregates._sum.subtotal),
      vatSum: toNum(aggregates._sum.taxValue),
      totalSum: toNum(aggregates._sum.total),
      paidSum: toNum(aggregates._sum.paid),
      balanceSum: toNum(aggregates._sum.remaining),
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Build the final response list mapping decimal values to numbers
    const mappedData = invoices.map(inv => {
      const dueDate = new Date(inv.date.getTime() + 30 * 24 * 60 * 60 * 1000);
      const overdue = inv.remaining.toNumber() > 0 && dueDate < new Date();
      let calculatedPaymentStatus = 'unpaid';
      if (inv.remaining.toNumber() === 0) {
        calculatedPaymentStatus = 'paid';
      } else if (inv.paid.toNumber() > 0) {
        calculatedPaymentStatus = 'partially_paid';
      } else if (overdue) {
        calculatedPaymentStatus = 'overdue';
      }

      let source = 'manual';
      if (inv.salesQuotation) {
        source = 'quotation';
      } else if (inv.shiftId) {
        source = 'pos';
      }

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date.toISOString(),
        dueDate: dueDate.toISOString(),
        customerName: inv.customer?.name || 'عميل نقدي',
        customerTaxNumber: inv.customer?.taxNumber || '',
        customerPhone: inv.customer?.phone || '',
        subtotal: inv.subtotal.toNumber(),
        taxValue: inv.taxValue.toNumber(),
        total: inv.total.toNumber(),
        paid: inv.paid.toNumber(),
        remaining: inv.remaining.toNumber(),
        paymentType: inv.paymentType,
        status: inv.status,
        paymentStatus: calculatedPaymentStatus,
        zatcaStatus: inv.zatcaStatus || 'pending',
        docType: inv.docType || 'invoice',
        source,
        quotationNo: inv.salesQuotation?.quotationNo || null,
        sourceQuotationId: inv.salesQuotation?.id || null,
        branchName: inv.branch?.name || '',
        userName: inv.user?.fullName || inv.user?.username || '',
        updatedAt: inv.date.toISOString(),
      };
    });

    return NextResponse.json({
      data: mappedData,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
      },
      totals,
      appliedFilters: {
        q,
        status,
        paymentStatus,
        zatcaStatus,
        customerId,
        branchId,
        createdById,
        sourceType,
        sourceQuotationId,
        invoiceType,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        minTotal,
        maxTotal,
        minBalance,
        maxBalance,
        productId,
        taxNumber,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}, { module: 'sales', permission: 'view' });
