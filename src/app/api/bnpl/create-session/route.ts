import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    try {
        const body = await request.json();
        const { amount, provider, customerPhone, items } = body;

        // In a real integration, this sends an HTTP POST to Tabby/Tamara APIs:
        // fetch('https://api.tabby.ai/api/v2/checkout', { ... })
        // fetch('https://api.tamara.co/checkout/v1/sessions', { ... })

        const mockPaymentId = crypto.randomUUID();
        const mockQrUrl = `https://pay.${provider.toLowerCase()}.com/checkout/${mockPaymentId}`;

        return NextResponse.json({
            success: true,
            sessionId: mockPaymentId,
            qrUrl: mockQrUrl,
            message: `تم فتح جلسة ${provider} بنجاح`
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
