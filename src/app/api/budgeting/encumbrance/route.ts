import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { BudgetControlEngine } from '@/lib/budget-control';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, accountId, costCenterId, amount, docType, docId } = body;

        const engine = new BudgetControlEngine(prisma);

        if (action === 'check') {
            const result = await engine.checkBudgetAvailability(accountId, costCenterId || null, amount);
            return NextResponse.json(result);
        }

        if (action === 'encumber') {
            const enc = await engine.createEncumbrance(docType, docId, accountId, costCenterId || null, amount);
            return NextResponse.json({ message: 'Encumbrance created', data: enc });
        }

        if (action === 'release') {
            const result = await engine.releaseEncumbrance(docType, docId);
            return NextResponse.json({ message: 'Encumbrance released', count: result.count });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
