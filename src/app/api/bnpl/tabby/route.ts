import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export async function POST(req: NextRequest) {
    try {
        // Authenticate Request
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        let decodedUser: any;
        try { decodedUser = jwt.verify(token, JWT_SECRET); } 
        catch { return NextResponse.json({ error: 'Invalid Token' }, { status: 401 }); }

        // Fetch Tabby Keys from generic Settings table
        const tabbyKeySetting = await prisma.setting.findUnique({ where: { key: 'tabby_api_key' } });
        const tabbyCodeSetting = await prisma.setting.findUnique({ where: { key: 'tabby_merchant_code' } });

        const tabbyKey = tabbyKeySetting?.value;
        const merchantCode = tabbyCodeSetting?.value;

        if (!tabbyKey || !merchantCode) {
            return NextResponse.json({ error: 'مفاتيح الربط لـ تابي (API Keys) غير مهيأة في الإعدادات.' }, { status: 400 });
        }

        const body = await req.json();
        const { totalAmount, phone, customerName, orderId, items } = body;

        if (!totalAmount || !phone) {
            return NextResponse.json({ error: 'المبلغ الإجمالي ورقم جوال العميل حقول مطلوبة.' }, { status: 400 });
        }

        // Standardize Saudi Phone Number
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('05')) formattedPhone = '+966' + formattedPhone.slice(1);
        else if (formattedPhone.startsWith('5')) formattedPhone = '+966' + formattedPhone;

        // Construct Tabby Checkout Payload
        const payload = {
            payment: {
                amount: totalAmount.toString(),
                currency: 'SAR',
                description: `فاتورة المبيعات #${orderId || 'POS'}`,
                buyer: { phone: formattedPhone, email: 'customer@namainvest.com', name: customerName || 'عميل نقدي' },
                order: {
                    tax_amount: (totalAmount * 0.15).toFixed(2),
                    shipping_amount: '0.00',
                    discount_amount: '0.00',
                    updated_at: new Date().toISOString(),
                    reference_id: `POS-${Date.now()}`,
                    items: items || []
                }
            },
            lang: 'ar',
            merchant_code: merchantCode,
            merchant_urls: {
                success: 'https://namainvist.com/payment-success',
                cancel: 'https://namainvist.com/payment-cancel',
                failure: 'https://namainvist.com/payment-failure'
            }
        };

        const tabbyRes = await fetch('https://api.tabby.ai/api/v2/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tabbyKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await tabbyRes.json();

        if (!tabbyRes.ok || data.warning || data.error) {
            console.error('Tabby Rejection:', data);
            return NextResponse.json({ error: data.error || 'عذراً، تابي رفضت الجلسة. تأكد من صحة البيانات والمفاتيح.' }, { status: 400 });
        }

        const checkoutUrl = data.configuration?.available_products?.installments?.[0]?.web_url;
        const paymentId = data.payment?.id;

        if (!checkoutUrl) {
            return NextResponse.json({ error: 'لم يتم العثور على رابط التقسيط المناسب من تابي.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, paymentId, checkoutUrl });

    } catch (err: any) {
        console.error('Tabby Error:', err);
        return NextResponse.json({ error: 'خلل داخلي أثناء الاتصال بخوادم تابي.' }, { status: 500 });
    }
}
