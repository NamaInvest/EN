import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getBnplKeys, createTabbySession, createTamaraSession } from '@/lib/bnpl';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  provider: z.any().optional(),
  amount: z.number().optional(),
  items: z.array(z.any()).optional(),
  phone: z.string().optional(),
  customerName: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
        return apiError(error, 'فشل في إنشاء جلسة التقسيط', { context: 'pos/bnpl' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
