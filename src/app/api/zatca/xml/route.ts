import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca.xml' });

const GETQuerySchema = z.object({
  invoiceId: z.string().regex(/^\d+$/, 'invoiceId must be a positive integer'),
});

async function _GET(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    const tenantId = requireTenantId(request as any);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = GETQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'يرجى تحديد رقم الفاتورة', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { invoiceId } = parsed.data;
    const invoice = await prisma.salesInvoice.findFirst({
      where: { id: parseInt(invoiceId), tenantId },
      select: { id: true, invoiceNo: true, zatcaXml: true, zatcaStatus: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    }
    if (!invoice.zatcaXml) {
      return NextResponse.json({ error: 'لا يوجد XML موقّع لهذه الفاتورة' }, { status: 404 });
    }

    return new NextResponse(invoice.zatcaXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNo}_zatca.xml"`,
      },
    });
  } catch (error: any) {
    log.error('ZATCA XML download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
