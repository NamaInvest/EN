import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { hasPermission } from '@/lib/auth';
import { z } from 'zod';

const LineSchema = z.object({
  productId: z.number().nullable().optional(),
  description: z.string().optional().nullable(),
  quantity: z.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  unitPrice: z.number().nonnegative('السعر يجب أن يكون أكبر من أو يساوي صفر'),
  discountRate: z.number().min(0).max(100).optional().default(0),
  taxRate: z.number().min(0).optional().default(15),
});

const UpdateQuoteSchema = z.object({
  customerId: z.number().nullable().optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email('بريد إلكتروني غير صالح').optional().nullable().or(z.literal('')),
  contactPhone: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  currency: z.string().optional().default('SAR'),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(LineSchema).min(1, 'يجب إضافة بند واحد على الأقل'),
});

export const GET = withRoute(async ({ prisma, auth }, context) => {
  const allowed = await hasPermission(auth.userId, 'sales.quotation.view', prisma);
  if (!allowed) {
    return NextResponse.json({ error: 'صلاحيات غير كافية لعرض عروض الأسعار' }, { status: 403 });
  }

  const { id } = await context.params;
  const quoteId = parseInt(id, 10);
  if (isNaN(quoteId)) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  try {
    const quotation = await prisma.salesQuotation.findFirst({
      where: { id: quoteId, tenantId: auth.tenantId },
      include: {
        customer: true,
        lines: {
          orderBy: { sortOrder: 'asc' },
        },
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل جلب تفاصيل عرض السعر', message: e.message }, { status: 500 });
  }
});

export const PATCH = withRoute(async ({ prisma, auth, req }, context) => {
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
    });

    if (!existing) {
      return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'لا يمكن تعديل عرض السعر إلا إذا كان في حالة مسودة' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let total = 0;

    const linesData = data.lines.map((line, index) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const discountAmount = lineSubtotal * (line.discountRate / 100);
      const lineAfterDiscount = lineSubtotal - discountAmount;
      const taxAmount = lineAfterDiscount * (line.taxRate / 100);
      const lineTotal = lineAfterDiscount + taxAmount;

      subtotal += lineSubtotal - discountAmount;
      discountTotal += discountAmount;
      taxTotal += taxAmount;
      total += lineTotal;

      return {
        tenantId: auth.tenantId,
        productId: line.productId || null,
        description: line.description || '',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountRate: line.discountRate,
        discountAmount,
        taxRate: line.taxRate,
        taxAmount,
        lineTotal,
        sortOrder: index,
      };
    });

    const updated = await prisma.$transaction(async (tx) => {
      // delete existing lines
      await tx.salesQuotationLine.deleteMany({
        where: { quotationId: quoteId, tenantId: auth.tenantId },
      });

      // update main quotation and add lines
      return tx.salesQuotation.update({
        where: { id: quoteId, tenantId: auth.tenantId },
        data: {
          customerId: data.customerId || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          currency: data.currency,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          terms: data.terms || null,
          notes: data.notes || null,
          lines: {
            create: linesData,
          },
        },
        include: {
          lines: true,
          customer: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل تحديث عرض السعر', message: e.message }, { status: 500 });
  }
});
