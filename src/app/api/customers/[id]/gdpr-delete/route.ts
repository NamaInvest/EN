import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getUserFromRequest } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/customers/[id]/gdpr-delete
 * حذف البيانات الشخصية للعميل (GDPR / PDPL)
 * يحافظ على السجلات المالية مع إخفاء الهوية
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUserFromRequest(req as any);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'صلاحية المدير مطلوبة' }, { status: 403 });
  }

  const prisma = new PrismaClient();
  try {
    const customerId = parseInt(id);
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    // إخفاء الهوية مع الحفاظ على السجلات المالية
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: `عميل محذوف #${customerId}`,
        phone: null,
        address: null,
        street: null,
        buildingNumber: null,
        district: null,
        city: null,
        postalCode: null,
        taxNumber: null,
        crNo: null,
        notes: null,
        password: null,
        active: false,
      },
    });

    // تسجيل في سجل المراقبة
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'GDPR_DELETE',
        tableName: 'customers',
        recordId: String(customerId),
        details: `تم حذف البيانات الشخصية للعميل "${customer.name}" وفقاً لنظام حماية البيانات (PDPL)`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف البيانات الشخصية بنجاح. السجلات المالية محفوظة لأغراض المحاسبة.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
