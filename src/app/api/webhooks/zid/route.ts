import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'webhooks/zid' });
import crypto from 'crypto';

// زد ويب هوك - استقبال الطلبات الجديدة
import { getUserFromRequest } from '@/lib/auth';

/** Timing-safe token comparison for Zid */
function verifyZidToken(received: string, expected: string): boolean {
    const recv = received.replace(/^Bearer /, '');
    const expc = expected.replace(/^Bearer /, '');
    if (recv.length !== expc.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(recv), Buffer.from(expc));
    } catch (err: unknown) {
 log.error('src/app/api/webhooks/zid/route.ts', { error: err instanceof Error ? err.message : err });
 return false; }
}

const ZidPayloadSchema = z.object({
    event: z.string().min(1),
    data:  z.any(),
}).passthrough();

// الرابط المفترض تسجيله في زد: https://yourdomain.com/api/webhooks/zid
async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const bodyText   = await request.text();
        const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';

        // 1. جلب إعدادات الربط من قاعدة البيانات
        const settings = await prisma.setting.findMany({ take: 100,
            where: { key: { in: ['zid_enabled', 'zid_webhook_secret'] } }
        });
        const zidEnabled   = settings.find(s => s.key === 'zid_enabled')?.value === '1';
        const clientSecret = settings.find(s => s.key === 'zid_webhook_secret')?.value || '';

        if (!zidEnabled) {
            return NextResponse.json({ message: 'الربط غير مفعل' }, { status: 400 });
        }

        // 2. التحقق من التوقيع بطريقة آمنة زمنياً (timing-safe)
        if (clientSecret) {
            if (!authHeader || !verifyZidToken(authHeader, clientSecret)) {
                log.error('Zid Webhook: Invalid Signature/Token');
                return NextResponse.json({ error: 'توقيع غير صالح' }, { status: 401 });
            }
        }

        // 3. تحليل الـ payload مع Zod
        const rawPayload    = JSON.parse(bodyText);
        const parsedPayload = ZidPayloadSchema.safeParse(rawPayload);
        if (!parsedPayload.success) {
            return NextResponse.json({ error: 'هيكل الطلب غير صالح' }, { status: 400 });
        }
        const payload = parsedPayload.data;

        // 4. معالجة الحدث بناءً على نوعه
        if (payload.event === 'order.created' || payload.event === 'order.updated') {
            const order = payload.data;
            if (order.status?.code === 'delivered' || order.status?.code === 'paid' || order.is_paid) {
                await processOrder(order, prisma);
            }
        }

        return NextResponse.json({ success: true, message: 'تم الاستلام بنجاح' });
    } catch (error: any) {
        log.error('Zid Webhook Error:', error);
        return NextResponse.json({ error: 'فشل في معالجة الطلب' }, { status: 500 });
    }
}

// دالة معالجة الطلب وتحويله إلى فاتورة مبيعات
async function processOrder(order: Record<string, any>, prisma: any) {
    const { runFinancialTx } = await import('@/lib/db/transaction');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    await runFinancialTx(prisma, async (tx) => {
        // التحقق مما إذا كان الطلب مسجل مسبقاً لتجنب التكرار
        const existingInvoice = await tx.salesInvoice.findFirst({
            where: { notes: { contains: `ZID_ORDER_ID:${order.id}` } }
        });

        if (existingInvoice) {
            log.info(`Zid Order ${order.id} already processed.`);
            return;
        }

        // جلب المنتجات من الطلب وربطها بالـ الباركود أو الرمز التعريفي في النظام المحلي
        const invoiceItems = [];
        let subtotal = 0;
        let taxValue = 0;

        for (const item of order.products) {
            // البحث عن المنتج محلياً
            const localProduct = await tx.product.findFirst({
                where: {
                    OR: [
                        { barcode: item.sku }, // Zid uses SKU too
                        { name: item.name } // محاولة أخيرة بالاسم
                    ]
                }
            });

            const qty = item.quantity;
            const price = item.price;
            const itemTax = (item.tax || 0) * qty;
            
            subtotal += (price * qty);
            taxValue += itemTax;

            if (localProduct) {
                 invoiceItems.push({
                     productId: localProduct.id,
                     productName: localProduct.name,
                     quantity: qty,
                     price: price,
                     discountRate: 0,
                     discountValue: 0,
                     taxRate: 15,
                     taxValue: itemTax,
                     total: (price * qty) + itemTax
                 });

                 // تحديث كمية المخزون
                 await tx.product.update({
                     where: { id: localProduct.id },
                     data: { currentStock: { decrement: qty } }
                 });
            }
        }

        if (invoiceItems.length === 0) {
            log.warn(`لم يتم العثور على أي منتجات مطابقة لطلب زد رقم ${order.id}`);
            return; // لا نستطيع إنشاء الفاتورة بدون منتجات معروفة
        }

        // استخراج رقم عميل عام أو إنشائه
        let customerId = null;
        if (order.customer) {
            const customerPhone = order.customer.mobile?.toString() || '';
            let customer = await tx.customer.findFirst({ where: { phone: customerPhone }});
            if (!customer && customerPhone) {
                customer = await tx.customer.create({
                    data: {
                        name: `${order.customer.name || ''}`.trim() || 'عميل زد',
                        phone: customerPhone,
                    }
                });
            }
            customerId = customer?.id;
        }

        // إنشاء فاتورة المبيعات
        const lastInvoice = await tx.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;
        const total = subtotal + taxValue; // أو نستخدم order.total مباشرة

        const invoice = await tx.salesInvoice.create({
            data: {
                invoiceNo,
                customerId: customerId,
                stockId: 1, // المتجر الرئيسي افتراضياً
                subtotal,
                taxValue,
                total,
                paid: total,
                remaining: 0,
                paymentType: 'bank', // عادة تحويل بنكي أو إلكتروني
                status: 'completed',
                userId: 1, // مسؤول النظام
                notes: `طلب زد رقم: ${order.id} | ZID_ORDER_ID:${order.id}`,
                details: {
                    create: invoiceItems
                }
            }
        });

        // تسجيل الدفعة في الخزينة/البنك
        await TreasuryPostingService.createTreasuryEntry(
            tx,
            {
                type: 'in',
                amount: total,
                description: `تحصيل طلب زد رقم ${order.id}`,
                referenceType: 'sale',
                referenceId: invoice.id,
            },
            1, // userId
            1  // branchId
        );

        // إنشاء القيد المحاسبي المزدوج الآلي
        try {
            await postSalesInvoice({
                invoiceNo: invoice.invoiceNo,
                subtotal: Number(invoice.subtotal),
                taxValue: Number(invoice.taxValue),
                total: Number(invoice.total),
                paymentType: invoice.paymentType,
                date: new Date().toISOString().split('T')[0],
                txClient: tx, // تمرير tx لضمان الارتباط
            });
        } catch (journalErr: unknown) {
            log.warn('Auto-journal for Zid order skipped:', journalErr);
        }

        log.info(`تم استيراد طلب زد رقم ${order.id} بنجاح كفاتورة #${invoice.invoiceNo}`);
    }, `zid-order-${order.id}`);
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
