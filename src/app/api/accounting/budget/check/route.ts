import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { BudgetEngine } from '@/lib/budget-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.budget.check' });


const _POSTSchema = z.object({
  accountId: z.union([z.string(), z.number()]).optional(),
  costCenterId: z.union([z.string(), z.number()]).optional(),
  newAmount: z.number().optional(),
  date: z.string().optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { accountId, costCenterId, newAmount, date } = body;

        if (!accountId || !newAmount || !date) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await BudgetEngine.checkBudget(
            parseInt(accountId),
            costCenterId ? parseInt(costCenterId) : null,
            parseFloat(newAmount),
            new Date(date)
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        // If strict budgeting throws an error
        return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
