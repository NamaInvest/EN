import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.budget-control' });

async function _GET(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        const mockBudgets = [
            {
                id: 1,
                name: `Annual Budget ${year}`,
                year,
                status: 'APPROVED',
                totalAmount: 5000000,
                consumedAmount: 1250000,
                createdAt: new Date().toISOString(),
                lines: [
                    { id: 1, account: { code: '101', name: 'Operations' }, amount: 2000000, consumed: 500000 },
                    { id: 2, account: { code: '202', name: 'Marketing' }, amount: 1000000, consumed: 350000 }
                ]
            }
        ];

        return NextResponse.json({ success: true, budgets: mockBudgets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action } = body;

        switch (action) {
            case 'check': {
                return NextResponse.json({ success: true, result: { available: true, remaining: 10000 } });
            }
            case 'variance': {
                return NextResponse.json({ success: true, variance: [] });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
