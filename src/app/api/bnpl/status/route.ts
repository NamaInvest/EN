import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { provider, orderId } = body;

        if (!provider || !orderId) {
            return NextResponse.json({ error: 'Missing polling parameters' }, { status: 400 });
        }

        // Ideally, we would hit the ACTUAL Tabby / Tamara APIs here via GET requests using their Bearer tokens attached to this merchant.
        
        // Example for Tabby Real Implementation:
        // const setting = await prisma.setting.findFirst({ where: { key: 'tabby_api_key' } });
        // const tabbyKey = setting?.value;
        // const response = await fetch(`https://api.tabby.ai/api/v2/payments/${orderId}`, {
        //     headers: { Authorization: `Bearer ${tabbyKey}` }
        // });
        // const TABBY_DATA = await response.json();
        // if (TABBY_DATA.status === 'AUTHORIZED' || TABBY_DATA.status === 'CLOSED') {
        //    return NextResponse.json({ status: 'PAID' });
        // }

        // Since we don't have LIVE merchant tokens connected to a physical POS session right at this dev layer,
        // we will simulate the polling sequence for demonstration.
        // In full production with live tokens, replace the below random math with the actual API hit.

        // Simulation: wait pseudo-random cycles then approve
        const simulatedStatusCheck = Math.random() > 0.7 ? 'PAID' : 'PENDING';

        return NextResponse.json({ 
            provider, 
            orderId, 
            status: simulatedStatusCheck
        });

    } catch (e: any) {
        console.error('BNPL Polling Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
