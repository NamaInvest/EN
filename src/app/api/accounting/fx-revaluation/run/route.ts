import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FxRevaluationEngine } from '@/lib/fx-revaluation';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.fx-revaluation.run' });


const _POSTSchema = z.object({
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
  baseCurrencyCode: z.any().optional(),
  periodEndDate: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fiscalPeriodId, baseCurrencyCode, periodEndDate, userId } = body;

        if (!fiscalPeriodId || !baseCurrencyCode || !periodEndDate || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const runRecord = await FxRevaluationEngine.runRevaluation(
            parseInt(fiscalPeriodId),
            baseCurrencyCode,
            new Date(periodEndDate),
            userId.toString()
        );

        return NextResponse.json({ success: true, run: runRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
