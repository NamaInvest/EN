import { NextRequest, NextResponse } from 'next/server';
import { MoyasarEngine } from '@/lib/payment-gateway/moyasar';

export async function POST(req: NextRequest) {

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
