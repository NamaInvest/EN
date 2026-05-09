import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';

// زد ويب هوك - استقبال الطلبات الجديدة
// الرابط المفترض تسجيله في زد: https://yourdomain.com/api/webhooks/zid
import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('Authorization') || request.headers.get('authorization');

        // 1. التحقق من التوافق (الأمان)
        const settings = await prisma.setting.findMany({
            take: 100,
            where: { key: { in: ['zid_enabled', 'zid_webhook_secret'] } }
        });
        const zidEnabled = settings.find(s => s.key === 'zid_enabled')?.value === '1';
        const clientSecret = settings.find(s => s.key === 'zid_webhook_secret')?.value || '';

        if (!zidEnabled) {
            return NextResponse.json({ message: 'الربط غير مفعل' }, { status: 400 });
        }

        // Zid uses a pre-shared token passed in Authorization header
        if (signature && clientSecret && signature !== `Bearer ${clientSecret}` && signature !== clientSecret) {
            console.error('Zid Webhook: Invalid Signature/Token');
            return NextResponse.json({ error: 'توقيع غير صالح' }, { status: 401 }); 
        }

        const payload = JSON.parse(bodyText);
        
        // 2. معالجة الحدث بناءً على نوعه
        if (payload.event === 'order.created' || payload.event === 'order.updated') {
            const order = payload.data;
            
            if (order.status?.code === 'delivered' || order.status?.code === 'paid' || order.is_paid) {
                await processOrder(order, prisma);
            }
        }

        return NextResponse.json({ success: true, message: 'تم الاستلام بنجاح' });
    } catch (error: any) {
        console.error('Zid Webhook Error:', error);
        return NextResponse.json({ error: 'فشل في معالجة الطلب' }, { status: 500 });
    }
}

// دالة معالجة الطلب وتحويله إلى فاتورة مبيعات
async function processOrder(order: Record<string, any>, prisma: any) {
    // التحقق مما إذا كان الطلب مسجل مسبقاً لتجنب التكرار
    const existingInvoice = await prisma.salesInvoice.findFirst({
        where: { notes: { contains: `ZID_ORDER_ID:${order.id}` } }
    });

    if (existingInvoice) {
        console.log(`Zid Order ${order.id} already processed.`);
        return;
    }

    // جلب المنتجات من الطلب وربطها بالـ الباركود أو الرمز التعريفي في النظام المحلي
    const invoiceItems = [];
    let subtotal = 0;
    let taxValue = 0;

    for (const item of order.products) {
        // البحث عن المنتج محلياً
        const localProduct = await prisma.product.findFirst({
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
             await prisma.product.update({
                 where: { id: localProduct.id },
                 data: { currentStock: { decrement: qty } }
             });
        }
    }

    if (invoiceItems.length === 0) {
        console.warn(`لم يتم العثور على أي منتجات مطابقة لطلب زد رقم ${order.id}`);
        return; // لا نستطيع إنشاء الفاتورة بدون منتجات معروفة
    }

    // استخراج رقم عميل عام أو إنشائه
    let customerId = null;
    if (order.customer) {
        const customerPhone = order.customer.mobile?.toString() || '';
        let customer = await prisma.customer.findFirst({ where: { phone: customerPhone }});
        if (!customer && customerPhone) {
            customer = await prisma.customer.create({
                data: {
                    name: `${order.customer.name || ''}`.trim() || 'عميل زد',
                    phone: customerPhone,
                }
            });
        }
        customerId = customer?.id;
    }

    // إنشاء فاتورة المبيعات
    const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
    const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;
    const total = subtotal + taxValue; // أو نستخدم order.total مباشرة

    const invoice = await prisma.salesInvoice.create({
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
    await prisma.treasury.create({
        data: {
            type: 'in',
            amount: total,
            description: `تحصيل طلب زد رقم ${order.id}`,
            referenceType: 'sale',
            referenceId: invoice.id,
            userId: 1,
            branchId: 1
        }
    });

    // إنشاء القيد المحاسبي المزدوج الآلي
    try {
        await postSalesInvoice({
            invoiceNo: invoice.invoiceNo,
            subtotal: invoice.subtotal,
            taxValue: invoice.taxValue,
            total: invoice.total,
            paymentType: invoice.paymentType,
            date: new Date().toISOString().split('T')[0],
        });
    } catch (journalErr: unknown) {
        console.warn('Auto-journal for Zid order skipped:', journalErr);
    }

    console.log(`تم استيراد طلب زد رقم ${order.id} بنجاح كفاتورة #${invoice.invoiceNo}`);
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
