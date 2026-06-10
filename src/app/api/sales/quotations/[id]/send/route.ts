import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { hasPermission } from '@/lib/auth';

export const POST = withRoute(async ({ prisma, auth }, context) => {
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

    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'يمكن إرسال العروض التي في حالة مسودة فقط' }, { status: 400 });
    }

    const updated = await prisma.salesQuotation.update({
      where: { id: quoteId, tenantId: auth.tenantId },
      data: {
        status: 'SENT',
      },
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (e: any) {
    return NextResponse.json({ error: 'فشل تغيير حالة عرض السعر', message: e.message }, { status: 500 });
  }
});
