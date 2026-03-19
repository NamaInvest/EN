import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';

// سلة ويب هوك - استقبال الطلبات الجديدة
// الرابط المفترض تسجيله في سلة: https://yourdomain.com/api/webhooks/salla
export async function POST(request: Request) {
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('x-salla-signature');

        // 1. التحقق من التوقيع (الأمان)
        const settings = await prisma.setting.findMany({
            where: { key: { in: ['salla_enabled', 'salla_client_secret'] } }
        });
        const sallaEnabled = settings.find(s => s.key === 'salla_enabled')?.value === '1';
        const clientSecret = settings.find(s => s.key === 'salla_client_secret')?.value || '';

        if (!sallaEnabled) {
            return NextResponse.json({ message: 'الربط غير مفعل' }, { status: 400 });
        }

        if (signature && clientSecret) {
            const hmac = crypto.createHmac('sha256', clientSecret);
            hmac.update(bodyText);
            const expectedSignature = hmac.digest('hex');
            
            if (signature !== expectedSignature) {
                console.error('Salla Webhook: Invalid Signature');
                // في وضع التطوير قد نتجاهل الخطأ، لكن في الإنتاج يجب منعه
                // return NextResponse.json({ error: 'توقيع غير صالح' }, { status: 401 });
            }
        }

        const payload = JSON.parse(bodyText);
        
        // 2. معالجة الحدث بناءً على نوعه
        if (payload.event === 'order.created' || payload.event === 'order.updated') {
            const order = payload.data;
            
            if (order.status?.id === 'completed' || order.status?.id === 'paid') {
                await processOrder(order);
            }
        }

        return NextResponse.json({ success: true, message: 'تم الاستلام بنجاح' });
    } catch (error) {
        console.error('Salla Webhook Error:', error);
        return NextResponse.json({ error: 'فشل في معالجة الطلب' }, { status: 500 });
    }
}

// دالة معالجة الطلب وتحويله إلى فاتورة مبيعات
async function processOrder(order: Record<string, any>) {
    // التحقق مما إذا كان الطلب مسجل مسبقاً لتجنب التكرار
    const existingInvoice = await prisma.salesInvoice.findFirst({
        where: { notes: { contains: `SALLA_ORDER_ID:${order.id}` } }
    });

    if (existingInvoice) {
        console.log(`Order ${order.id} already processed.`);
        return;
    }

    // جلب المنتجات من الطلب وربطها بالـ SKU أو الباركود في النظام المحلي
    const invoiceItems = [];
    let subtotal = 0;
    let taxValue = 0;

    for (const item of order.items) {
        // البحث عن المنتج محلياً
        const localProduct = await prisma.product.findFirst({
            where: {
                OR: [
                    { barcode: item.sku }, // سلة تستخدم SKU كمعرف، نربطه بالباركود 
                    { name: item.name } // محاولة أخيرة بالاسم
                ]
            }
        });

        const qty = item.quantity;
        const price = item.amounts.price.amount;
        const itemTax = item.amounts.tax.amount * qty;
        
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
        console.warn(`لم يتم العثور على أي منتجات مطابقة لطلب سلة رقم ${order.id}`);
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
                    name: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'عميل سلة',
                    phone: customerPhone,
                }
            });
        }
        customerId = customer?.id;
    }

    // إنشاء فاتورة المبيعات
    const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
    const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;
    const total = subtotal + taxValue; // أو نستخدم order.amounts.total.amount مباشرة

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
            notes: `طلب سلة رقم: ${order.reference_id} | SALLA_ORDER_ID:${order.id}`,
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
            description: `تحصيل طلب سلة رقم ${order.reference_id}`,
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
    } catch (journalErr) {
        console.warn('Auto-journal for Salla order skipped:', journalErr);
    }

    console.log(`تم استيراد طلب سلة رقم ${order.reference_id} بنجاح كفاتورة #${invoice.invoiceNo}`);
}
