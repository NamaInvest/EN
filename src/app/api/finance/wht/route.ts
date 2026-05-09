import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WHTEngine } from '@/lib/wht-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const pending = await WHTEngine.getPendingWHTTransactions();

        return NextResponse.json({
            pendingCount: pending.length,
            totalAmount: pending.reduce((sum: number, tx: { whtAmount: number | { toNumber?: () => number } }) => {
                const amt = typeof tx.whtAmount === 'number' ? tx.whtAmount : Number(tx.whtAmount);
                return sum + amt;
            }, 0),
            transactions: pending,
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, invoiceId, serviceType, transactionIds, certificateNumber } = body;

        if (action === 'apply') {
            const tx = await WHTEngine.applyWHT(invoiceId, serviceType, String(auth.userId));
            return NextResponse.json({ message: 'WHT Applied successfully', data: tx });
        }

        if (action === 'mark_paid') {
            const result = await WHTEngine.markAsPaid(transactionIds, certificateNumber);
            return NextResponse.json({ message: 'Marked as paid', count: result.count });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
