import { NextResponse, NextRequest } from 'next/server';
import { getBnplKeys, createTabbySession, createTamaraSession } from '@/lib/bnpl';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
        const { provider, amount, items, phone, customerName } = body;

        if (!amount || !items || !provider) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const keys = await getBnplKeys();
        const orderId = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let session;
        if (provider === 'tabby') {
            session = await createTabbySession({ amount, orderId, phone, items, customerName }, keys);
        } else if (provider === 'tamara') {
            session = await createTamaraSession({ amount, orderId, phone, items, customerName }, keys);
        } else {
            return NextResponse.json({ error: 'مزود الدفع غير مدعوم' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            sessionId: session.sessionId,
            webUrl: session.webUrl,
            provider,
            referenceId: orderId
        });
    } catch (error: any) {
        console.error('BNPL Init Error:', error);
        return NextResponse.json({ error: error.message || 'فشل في إنشاء جلسة التقسيط' }, { status: 500 });
    }
}
