import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

// Public API - customer can place order from QR menu
async function _POST(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const body = await req.json();
        const { tableId, tableName, items, customerName, customerPhone, notes } = body;

        if (!items || !items.length) {
            return NextResponse.json({ success: false, error: 'الطلب فارغ' }, { status: 400 });
        }

        // Calculate total
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: parseInt(item.id) } });
            if (!product) continue;
            const itemTotal = n(product.sellPrice) * item.qty;
            subtotal += itemTotal;
            orderItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.qty,
                price: product.sellPrice,
                total: itemTotal
            });
        }

        const taxRate = 15;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;

        // Create a sales invoice marked as 'pending' (kitchen needs to confirm)
        const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = lastInvoice ? lastInvoice.invoiceNo + 1 : 10001;

        const invoice = await prisma.salesInvoice.create({
            data: {
                invoiceNo,
                date: new Date(),
                subtotal,
                taxValue: tax,
                total,
                paid: 0,
                remaining: total,
                paymentType: 'pending',
                status: 'pending',
                notes: `📱 طلب إلكتروني من المنيو${tableName ? ` | 🍽️ طاولة: ${tableName}` : tableId ? ` | طاولة رقم: ${tableId}` : ''}${customerName ? ` | العميل: ${customerName}` : ''}${customerPhone ? ` | الجوال: ${customerPhone}` : ''}${notes ? ` | ملاحظات: ${notes}` : ''}`,
            }
        });

        // Create invoice details
        for (const item of orderItems) {
            await prisma.salesInvoiceDetail.create({
                data: {
                    invoiceId: invoice.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    taxRate,
                    taxValue: item.total * (taxRate / 100),
                    total: item.total + (item.total * (taxRate / 100))
                }
            });
        }

        return NextResponse.json({
            success: true,
            orderNumber: invoiceNo,
            total,
            message: 'تم استلام طلبك بنجاح! سيتم تجهيزه قريباً.'
        });
    } catch (e: any) {
        console.error('Public order error:', e.message);
        return NextResponse.json({ success: false, error: 'حدث خطأ في إرسال الطلب' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
