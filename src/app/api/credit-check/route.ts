import { getUserFromRequest } from '@/lib/auth';
/**
 * Credit Check API
 * GET  /api/credit-check?customerId=X — Check credit for customer
 * GET  /api/credit-check?action=at-risk — List at-risk customers
 * POST /api/credit-check — Quick pass/fail check
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { CreditCheckEngine } from '@/lib/credit-check-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const action = req.nextUrl.searchParams.get('action');
    const customerId = req.nextUrl.searchParams.get('customerId');

    try {
        if (action === 'at-risk') {
            const threshold = parseFloat(req.nextUrl.searchParams.get('threshold') || '0.8');
            const results = await CreditCheckEngine.getAtRiskCustomers(prisma, threshold);
            return NextResponse.json(results);
        }

        if (customerId) {
            const result = await CreditCheckEngine.check(prisma, parseInt(customerId));
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'مطلوب: customerId أو action=at-risk' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (!body.customerId || !body.amount) {
            return NextResponse.json({ error: 'مطلوب: customerId, amount' }, { status: 400 });
        }

        const result = await CreditCheckEngine.canProceed(prisma, body.customerId, body.amount);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
