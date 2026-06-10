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

const CreateQuoteSchema = z.object({
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

export const GET = withRoute(async ({ prisma, auth, req }) => {
  const allowed = await hasPermission(auth.userId, 'sales.quotation.view', prisma);
  if (!allowed) {
    return NextResponse.json({ error: 'صلاحيات غير كافية لعرض عروض الأسعار' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');

  const where: any = {
    tenantId: auth.tenantId,
  };

  if (status) where.status = status;
  if (customerId) where.customerId = parseInt(customerId, 10);

  try {
    const quotations = await prisma.salesQuotation.findMany({
      where,
      include: {
        customer: true,
        lines: true,
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(quotations);
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل جلب عروض الأسعار', message: e.message }, { status: 500 });
  }
});

export const POST = withRoute(async ({ prisma, auth, req }) => {
  const allowed = await hasPermission(auth.userId, 'sales.quotation.create', prisma);
  if (!allowed) {
    return NextResponse.json({ error: 'صلاحيات غير كافية لإنشاء عرض سعر' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    // Generate quotation number (e.g. QT-2026-000001)
    const last = await prisma.salesQuotation.findFirst({
      where: { tenantId: auth.tenantId },
      orderBy: { id: 'desc' },
    });
    let nextNum = 1;
    if (last && last.quotationNo.startsWith('QT-')) {
      const parts = last.quotationNo.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const quotationNo = `QT-${new Date().getFullYear()}-${String(nextNum).padStart(6, '0')}`;

    // Calculations on the server
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

    const quotation = await prisma.salesQuotation.create({
      data: {
        tenantId: auth.tenantId,
        quotationNo,
        customerId: data.customerId || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: 'DRAFT',
        currency: data.currency,
        subtotal,
        discountTotal,
        taxTotal,
        total,
        terms: data.terms || null,
        notes: data.notes || null,
        createdById: auth.userId,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل إنشاء عرض السعر', message: e.message }, { status: 500 });
  }
});
