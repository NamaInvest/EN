import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { hasPermission } from '@/lib/auth';
import { getNextNumber } from '@/lib/numbering';

export const POST = withRoute(async ({ prisma, auth }, context) => {
  const allowed = await hasPermission(auth.userId, 'sales.quotation.update', prisma);
  if (!allowed) {
    return NextResponse.json({ error: 'صلاحيات غير كافية لتعديل عرض السعر' }, { status: 403 });
  }

  const { id } = await context.params;
  const quoteId = parseInt(id, 10);
  if (isNaN(quoteId)) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  try {
    const existing = await prisma.salesQuotation.findFirst({
      where: { id: quoteId, tenantId: auth.tenantId },
      include: {
        lines: true,
        customer: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
    }

    // Check if already converted
    if (existing.convertedInvoiceId) {
      const existingInvoice = await prisma.salesInvoice.findUnique({
        where: { id: existing.convertedInvoiceId, tenantId: auth.tenantId },
        include: { details: true },
      });
      if (existingInvoice) {
        return NextResponse.json({
          success: true,
          alreadyConverted: true,
          invoice: existingInvoice,
        });
      }
    }

    if (existing.status !== 'ACCEPTED') {
      return NextResponse.json({
        error: 'يمكن تحويل عروض الأسعار المقبولة (ACCEPTED) فقط إلى فواتير',
      }, { status: 400 });
    }

    // Execute atomic transaction for conversion
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify status under transaction lock
      const lockedQuote = await tx.salesQuotation.findUnique({
        where: { id: quoteId },
      });

      if (!lockedQuote || lockedQuote.convertedInvoiceId) {
        throw new Error('تم تحويل هذا العرض مسبقاً أو غير موجود');
      }

      // 1. Generate Invoice number using numbering sequence helper with fallback
      let finalInvoiceNo: number;
      try {
        const seqResult = await getNextNumber(tx, 'INV', null);
        finalInvoiceNo = seqResult.current;
      } catch (seqError) {
        const maxInvoice = await tx.salesInvoice.findFirst({
          where: { tenantId: auth.tenantId },
          orderBy: { invoiceNo: 'desc' },
        });
        finalInvoiceNo = maxInvoice ? maxInvoice.invoiceNo + 1 : 100001;
      }

      // 2. Map quotation lines to invoice details
      const invoiceDetails = existing.lines.map((line: any) => {
        const productId = line.productId ? Number(line.productId) : 1;
        const productName = line.description || 'صنف مبيعات';
        return {
          tenantId: auth.tenantId,
          productId,
          productName,
          quantity: line.quantity,
          price: line.unitPrice,
          discountRate: line.discountRate,
          discountValue: line.discountAmount,
          taxRate: line.taxRate,
          taxValue: line.taxAmount,
          total: line.lineTotal,
        };
      });

      // 3. Create the SalesInvoice in 'draft' state
      const createdInvoice = await tx.salesInvoice.create({
        data: {
          tenantId: auth.tenantId,
          date: new Date(),
          invoiceNo: finalInvoiceNo,
          customerId: existing.customerId,
          stockId: 1, // Default main warehouse
          subtotal: existing.subtotal,
          discountRate: existing.subtotal.toNumber() > 0 
            ? (existing.discountTotal.toNumber() / existing.subtotal.toNumber()) * 100 
            : 0,
          discountValue: existing.discountTotal,
          taxValue: existing.taxTotal,
          total: existing.total,
          paid: 0,
          remaining: existing.total,
          paymentType: 'cash',
          splitCash: 0,
          splitCard: 0,
          status: 'draft', // Lowercase draft state
          userId: auth.userId,
          notes: `محولة تلقائياً من عرض السعر رقم ${existing.quotationNo}. ${existing.notes || ''}`,
          docType: 'invoice',
          details: {
            create: invoiceDetails,
          },
        },
        include: {
          details: true,
        },
      });

      // 4. Update the Quotation state to CONVERTED and associate with invoice
      const updatedQuote = await tx.salesQuotation.update({
        where: { id: quoteId },
        data: {
          status: 'CONVERTED',
          convertedInvoiceId: createdInvoice.id,
          convertedAt: new Date(),
        },
      });

      return { invoice: createdInvoice, quotation: updatedQuote };
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحويل عرض السعر إلى فاتورة مبيعات مسودة بنجاح',
      invoice: result.invoice,
      quotation: result.quotation,
    }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: 'فشل تحويل عرض السعر إلى فاتورة', message: e.message }, { status: 500 });
  }
});
