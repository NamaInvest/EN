import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MoyasarEngine } from '@/lib/payment-gateway/moyasar';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { invoiceId, amount, gateway, source } = body;

        let transaction;
        if (gateway === 'MOYASAR') {
            transaction = await MoyasarEngine.createCharge(invoiceId, amount, source);
        } else {
            return NextResponse.json({ error: `Gateway ${gateway} not supported yet` }, { status: 400 });
        }

        return NextResponse.json({ success: true, transaction });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
