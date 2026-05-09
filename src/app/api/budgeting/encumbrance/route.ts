import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { BudgetControlEngine } from '@/lib/budget-control';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  action: z.any().optional(),
  accountId: z.union([z.string(), z.number()]).optional(),
  costCenterId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  docType: z.any().optional(),
  docId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
