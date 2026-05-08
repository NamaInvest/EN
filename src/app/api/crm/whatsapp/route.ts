import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// إرسال رسالة واتساب مع خيار إرفاق الفاتورة أو التذكير
import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { phone, message, invoiceId, type = 'invoice' } = body;

        if (!phone) {
            return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 });
        }

        // 1. جلب إعدادات الواتساب من قاعدة البيانات
        const settings = await prisma.setting.findMany({
            take: 100,
            where: { key: { in: ['whatsapp_enabled', 'whatsapp_token', 'whatsapp_phone_id'] } }
        });

        const enabled = settings.find(s => s.key === 'whatsapp_enabled')?.value === '1';
        const token = settings.find(s => s.key === 'whatsapp_token')?.value;
        const phoneId = settings.find(s => s.key === 'whatsapp_phone_id')?.value;

        if (!enabled || !token || !phoneId) {
            return NextResponse.json({ error: 'خدمة الواتساب غير مفعلة أو غير مهيأة بشكل صحيح' }, { status: 400 });
        }

        // تنسيق رقم الهاتف ليطابق المعيار الدولي (بدون + وإزالة الأصفار الأولى)
        let formattedPhone = phone.replace(/\\D/g, ''); // إزالة الرموز
        if (formattedPhone.startsWith('05')) {
            formattedPhone = '966' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('5')) { // إذا كان 5xxxxxxx بدون 0
            formattedPhone = '966' + formattedPhone;
        }

        // 2. إذا كان إرسال فاتورة، يجب أن نصدرها بصيغة PDF أولاً إذا لم تكن موجودة، ثم نرفعها للواتساب
        let mediaId = null;
        if (type === 'invoice' && invoiceId) {
            // في البيئة الحقيقية، نقوم بتوليد الـ PDF ورفعه إلى سيرفرات Meta للحصول على Media ID
            // للتوضيح وتوفير الكود المعقد، هنا محاكاة لرفع الملف 
            // const pdfPath = await generateInvoicePDF(invoiceId);
            // mediaId = await uploadMediaToWhatsApp(pdfPath, token);
            // لغرض التجربة حالياً، سنستخدم رابط الفاتورة المباشر إذا كان التوليد الديناميكي متاحاً
            console.log(`Preparing invoice ${invoiceId} for ${formattedPhone}`);
        }

        // 3. بناء هيكل الرسالة (WhatsApp Cloud API)
        const waPayload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
        };

        if (mediaId || (type === 'invoice' && invoiceId)) {
            // إرسال مستند (PDF) - باستخدام رابط مباشر أو ID
            const invoiceLink = `https://my-erp-domain.com/invoices/view/${invoiceId}`; // رابط تخيلي
            const fullMessage = message ? message : 'مرفق لكم فاتورة المشتريات/المبيعات الخاصة بكم. شكراً لتعاملكم معنا!';

            // عادة نرسل قالب معتمد (Template) إذا انقضت 24 ساعة، لكن للتسهيل نرسل نص + رابط
            waPayload.type = 'text';
            waPayload.text = {
                body: `${fullMessage}\n\nيمكنك عرض وتحميل الفاتورة (PDF) من هنا:\n${invoiceLink}`
            };
        } else if (type === 'reminder') {
            // رسالة المديونية والتذكير بالرصيد
            const amountDue = body.balance || '0.00';
            const reminderMessage = message || `عزيزي العميل،\nنود تذكيركم بأن الرصيد المستحق (المديونية) على حسابكم هو: ${amountDue} ر.س.\nنرجو منكم التكرم بالسداد في أقرب فرصة ممكنة لتجنب إيقاف الخدمة.\n\nشكراً لتعاونكم.`;
            waPayload.type = 'text';
            waPayload.text = { body: reminderMessage };
        } else {
            // رسالة نصية بسيطة (مثل: رسائل ترحيب، تحديثات عامة)
            waPayload.type = 'text';
            waPayload.text = { body: message };
        }

        // 4. إرسال الطلب إلى Meta WhatsApp API
        const waUrl = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
        const response = await fetch(waUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(waPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API Error:', result);
            return NextResponse.json({ error: 'فشل في إرسال رسالة الواتساب عبر Meta', details: result }, { status: response.status });
        }

        return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id });

    } catch (error: any) {
        console.error('WhatsApp Send Error:', error);
        return NextResponse.json({ error: 'فشل الاتصال بخادم الواتساب المدمج' }, { status: 500 });
    }
}
