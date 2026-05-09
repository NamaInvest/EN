import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ConsolidationEngine } from '@/lib/consolidation-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  runId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { runId } = body;

        if (!runId) {
            return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
        }

        const run = await ConsolidationEngine.postConsolidation(parseInt(runId));

        return NextResponse.json({ success: true, run });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
