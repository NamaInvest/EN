import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { AllocationEngine } from '@/lib/allocation-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.allocations.simulate' });


const _POSTSchema = z.object({
  ruleId: z.union([z.string(), z.number()]).optional(),
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { ruleId, fiscalPeriodId } = body;

        if (!ruleId || !fiscalPeriodId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const simulation = await AllocationEngine.simulateAllocation(
            parseInt(ruleId),
            parseInt(fiscalPeriodId)
        );

        return NextResponse.json({ success: true, simulation });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
