import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { WHTEngine } from '@/lib/wht-engine';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const engine = new WHTEngine(prisma as any);
        const pending = await engine.getPendingWHTTransactions();
        
        return NextResponse.json({
            pendingCount: pending.length,
            totalAmount: pending.reduce((sum: number, tx: any) => sum + tx.whtAmount, 0),
            transactions: pending
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, invoiceId, isResident, serviceType, transactionIds, certificateNumber } = body;

        const engine = new WHTEngine(prisma as any);

        if (action === 'apply') {
            const tx = await engine.applyWHT(invoiceId, isResident, serviceType);
            return NextResponse.json({ message: 'WHT Applied successfully', data: tx });
        }

        if (action === 'mark_paid') {
            const result = await engine.markAsPaid(transactionIds, certificateNumber);
            return NextResponse.json({ message: 'Marked as paid', count: result.count });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
