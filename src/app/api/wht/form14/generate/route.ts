import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * WHT Form 14 Generation API
 * POST /api/wht/form14/generate — Generate Form 14 batch for a period
 * GET  /api/wht/form14/generate — Get existing batch status
 */
import { NextRequest, NextResponse } from 'next/server';
import { WHTEngine } from '@/lib/wht-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wht.form14.generate' });


const _POSTSchema = z.object({
  period: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const period = body.period; // YYYY-MM
        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            return NextResponse.json({ error: 'مطلوب period بصيغة YYYY-MM' }, { status: 400 });
        }

        const result = await WHTEngine.generateForm14(period);
        if (result.error) return NextResponse.json({ error: result.error }, { status: 404 });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
