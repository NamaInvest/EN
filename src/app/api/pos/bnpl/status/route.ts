import { NextResponse, NextRequest } from 'next/server';
import { getBnplKeys, getTabbyPaymentStatus, getTamaraOrderStatus } from '@/lib/bnpl';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const sessionId = searchParams.get('sessionId');

        if (!provider || !sessionId) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const keys = await getBnplKeys();
        let status = 'PENDING';
        let isSuccess = false;

        if (provider === 'tabby') {
            status = await getTabbyPaymentStatus(sessionId, keys);
            // Tabby statuses: CREATED, AUTHORIZED, CLOSED, REJECTED, EXPIRED
            if (status === 'AUTHORIZED' || status === 'CLOSED') {
                isSuccess = true;
            }
        } else if (provider === 'tamara') {
            status = await getTamaraOrderStatus(sessionId, keys);
            // Tamara statuses: NEW, APPROVED, DECLINED, CANCELED, AUTHORISED, FULLY_CAPTURED
            if (status === 'APPROVED' || status === 'AUTHORISED' || status === 'FULLY_CAPTURED') {
                isSuccess = true;
            }
        } else {
            return NextResponse.json({ error: 'مزود الدفع غير مدعوم' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            status,
            isSuccess,
            provider
        });
    } catch (error: any) {
        console.error('BNPL Status Error:', error);
        return apiError(error, 'فشل في استرداد حالة الدفع', { context: 'pos/bnpl/status' });
    }
}
