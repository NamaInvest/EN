import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bnpl.tamara' });

const JWT_SECRET = (process.env.JWT_SECRET as string);


const _POSTSchema = z.object({
  totalAmount: z.number().optional(),
  phone: z.string().optional(),
  customerName: z.any().optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        let decodedUser: any;
        try { decodedUser = jwt.verify(token, JWT_SECRET); } 
        catch { return NextResponse.json({ error: 'Invalid Token' }, { status: 401 }); }

        const tamaraTokenSetting = await prisma.setting.findUnique({ where: { key: 'tamara_bearer_token' } });
        const tamaraToken = tamaraTokenSetting?.value;

        if (!tamaraToken) {
            return NextResponse.json({ error: 'مفتاح الربط الخاص بتمارا (Bearer Token) غير مهيأ في الإعدادات.' }, { status: 400 });
        }

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { totalAmount, phone, customerName, orderId, items } = body;

        if (!totalAmount || !phone) return NextResponse.json({ error: 'المبلغ المالي ورقم الجوال مطلوبان.' }, { status: 400 });

        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.slice(1);
        else if (formattedPhone.startsWith('5')) formattedPhone = '966' + formattedPhone;

        const uid = `POS-${Date.now()}`;
        
        const payload = {
            order_reference_id: uid,
            total_amount: { amount: parseFloat(totalAmount).toFixed(2), currency: 'SAR' },
            description: `فاتورة المبيعات #${orderId || uid}`,
            country_code: 'SA',
            payment_type: 'PAY_BY_INSTALMENTS',
            locale: 'ar_SA',
            items: (items || []).map((i: any) => ({
                reference_id: i.id?.toString() || '0',
                type: 'Digital',
                name: i.title || i.name || 'عنصر',
                sku: 'SKU-' + (i.id || '1'),
                quantity: i.quantity || 1,
                total_amount: { amount: parseFloat(i.total || i.price).toFixed(2), currency: 'SAR' }
            })),
            consumer: {
                first_name: customerName || 'عميل',
                last_name: 'نقدي',
                phone_number: formattedPhone,
                email: 'customer@namainvest.com'
            },
            merchant_url: {
                success: 'https://namainvist.com/payment-success',
                failure: 'https://namainvist.com/payment-failure',
                cancel: 'https://namainvist.com/payment-cancel',
                notification: 'https://namainvist.com/webhook/tamara'
            }
        };

        const res = await fetch('https://api.tamara.co/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tamaraToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || data.errors) {
            log.error('Tamara Rejection:', data);
            return NextResponse.json({ error: data.message || 'عذراً، رفضت تمارا الجلسة. تأكد من الإعدادات.' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            orderId: data.order_id,
            checkoutUrl: data.checkout_url
        });

    } catch (err: any) {
        log.error('Tamara Error:', err);
        return NextResponse.json({ error: 'خلل داخلي في خوادم تمارا.' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
