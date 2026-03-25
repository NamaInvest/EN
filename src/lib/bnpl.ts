// src/lib/bnpl.ts
import prisma from '@/lib/prisma';

export async function getBnplKeys() {
    const settings = await prisma.setting.findMany({
        where: { key: { in: ['tabby_api_key', 'tabby_merchant_code', 'tamara_bearer_token'] } }
    });
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value || '');
    return {
        tabbyKey: map['tabby_api_key'] || '',
        tabbyMerchant: map['tabby_merchant_code'] || '',
        tamaraToken: map['tamara_bearer_token'] || ''
    };
}

export async function createTabbySession({ amount, orderId, phone, items, customerName }: any, keys: any) {
    if (!keys.tabbyKey || !keys.tabbyMerchant) throw new Error("مفاتيح تابي غير مدخلة في الإعدادات");

    // Format phone to E.164 without leading 0 (Tabby requires country code +966)
    let formattedPhone = phone || '0500000000';
    if (formattedPhone.startsWith('05')) formattedPhone = '+966' + formattedPhone.substring(1);

    const TABBY_API = "https://api.tabby.ai/api/v2/checkout";
    
    // Tabby Payload
    const payload = {
        payment: {
            amount: parseFloat(amount).toFixed(2),
            currency: "SAR",
            description: "فاتورة مشتريات من نقاط البيع",
            buyer: {
                phone: formattedPhone,
                email: "customer@domain.com",
                name: customerName || "عميل نقاط البيع",
                dob: "2000-01-01"
            },
            shipping_address: { city: "Riyadh", address: "Saudi Arabia", zip: "12211" },
            order: {
                tax_amount: (parseFloat(amount) * 0.15).toFixed(2), // Approximate if unknown
                shipping_amount: "0.00",
                discount_amount: "0.00",
                updated_at: new Date().toISOString(),
                reference_id: String(orderId),
                items: items.map((i: any) => ({
                    title: i.name,
                    quantity: i.quantity,
                    unit_price: parseFloat(i.price).toFixed(2),
                    category: "Retail"
                }))
            },
            buyer_history: { registered_since: new Date().toISOString(), loyalty_level: 0 }
        },
        lang: "ar",
        merchant_code: keys.tabbyMerchant,
        merchant_urls: {
            success: "https://your-domain.com/bnpl/success",
            cancel: "https://your-domain.com/bnpl/cancel",
            failure: "https://your-domain.com/bnpl/failure"
        }
    };

    const res = await fetch(TABBY_API, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${keys.tabbyKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Tabby Create Error:", data);
        throw new Error(data.error || "خطأ في إنشاء جلسة تابي");
    }

    // data.configuration.available_products.installments[0].web_url is the QR target
    const webUrl = data.configuration?.available_products?.installments?.[0]?.web_url;
    if (!webUrl) throw new Error("لم ترجع تابي رابط الدفع الآجل (Web URL)");

    return {
        sessionId: data.payment.id,
        webUrl: webUrl
    };
}

export async function getTabbyPaymentStatus(paymentId: string, keys: any) {
    const res = await fetch(`https://api.tabby.ai/api/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${keys.tabbyKey}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error("خطأ في فحص حالة تابي");
    return data.status; // 'CREATED', 'AUTHORIZED', 'CLOSED', 'REJECTED'
}

export async function createTamaraSession({ amount, orderId, phone, items, customerName }: any, keys: any) {
    if (!keys.tamaraToken) throw new Error("مفتاح تمارا غير مدخل في الإعدادات");

    const TAMARA_API = "https://api.tamara.co/checkout";
    let formattedPhone = phone || '0500000000';
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    const payload = {
        order_reference_id: String(orderId),
        total_amount: { amount: parseFloat(amount), currency: "SAR" },
        description: "فاتورة مشتريات",
        country_code: "SA",
        payment_type: "PAY_BY_INSTALLMENTS",
        items: items.map((i: any) => ({
            reference_id: String(i.id || Math.random()),
            type: "Physical",
            name: i.name,
            sku: String(i.id || "SKU"),
            quantity: i.quantity,
            total_amount: { amount: parseFloat(i.price) * i.quantity, currency: "SAR" }
        })),
        consumer: {
            first_name: customerName || "عميل",
            last_name: "المعرض",
            phone_number: formattedPhone,
            email: "consumer@example.com"
        },
        merchant_url: {
            success: "https://your-domain.com/bnpl/success",
            failure: "https://your-domain.com/bnpl/failure",
            cancel: "https://your-domain.com/bnpl/cancel",
            notification: "https://your-domain.com/bnpl/notification"
        }
    };

    const res = await fetch(TAMARA_API, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${keys.tamaraToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Tamara Create Error:", data);
        throw new Error(data.message || "خطأ في إنشاء جلسة تمارا");
    }

    return {
        sessionId: data.order_id,
        webUrl: data.checkout_url
    };
}

export async function getTamaraOrderStatus(orderId: string, keys: any) {
    const res = await fetch(`https://api.tamara.co/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${keys.tamaraToken}`
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error("خطأ في فحص حالة تمارا");
    return data.status; // 'NEW', 'APPROVED', 'DECLINED', 'CANCELED', 'AUTHORISED'
}
