import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * ZATCA XML Download API
 * GET /api/zatca/xml?invoiceId=13
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const invoiceId = request.nextUrl.searchParams.get('invoiceId');
        if (!invoiceId) return NextResponse.json({ error: 'يرجى تحديد رقم الفاتورة' }, { status: 400 });

        const invoice = await prisma.salesInvoice.findUnique({
            where: { id: parseInt(invoiceId) },
            select: { id: true, invoiceNo: true, zatcaXml: true, zatcaStatus: true },
        });

        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        if (!invoice.zatcaXml) return NextResponse.json({ error: 'لا يوجد XML موقّع لهذه الفاتورة' }, { status: 404 });

        return new NextResponse(invoice.zatcaXml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNo}_zatca.xml"`,
            },
        });
    } catch (error: any) {
        console.error('ZATCA XML download error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
