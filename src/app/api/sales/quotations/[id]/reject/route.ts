import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { hasPermission } from '@/lib/auth';

export const POST = withRoute(async ({ prisma, auth, req }, context) => {
  const allowed = await hasPermission(auth.userId, 'sales.quotation.update', prisma);
  if (!allowed) {
    return NextResponse.json({ error: 'صلاحيات غير كافية لتحديث عرض السعر' }, { status: 403 });
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

    if (existing.status !== 'DRAFT' && existing.status !== 'SENT') {
      return NextResponse.json({ error: 'يمكن رفض العروض التي في حالة مسودة أو مرسلة فقط' }, { status: 400 });
    }

    let notes = existing.notes || '';
    try {
      const body = await req.json();
      if (body.reason) {
        notes = notes ? `${notes}\nسبب الرفض: ${body.reason}` : `سبب الرفض: ${body.reason}`;
      }
    } catch {
      // Body may be empty, which is fine
    }

    const updated = await prisma.salesQuotation.update({
      where: { id: quoteId, tenantId: auth.tenantId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        notes,
      },
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل تغيير حالة عرض السعر', message: e.message }, { status: 500 });
  }
});
