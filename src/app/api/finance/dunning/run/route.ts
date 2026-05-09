import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { DunningEngine } from '@/lib/dunning-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  asOfDate: z.string().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const asOfDate = body.asOfDate ? new Date(body.asOfDate) : new Date();
        
        const results = await DunningEngine.executeDailyRun(asOfDate);

        // @ts-expect-error [TS2698] Spread types issue
        return NextResponse.json({ success: true, ...results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
