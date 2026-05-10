import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { QuoteEngine } from '@/lib/quote-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.quotes.id.revise' });


const _POSTSchema = z.object({
  changes: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { changes, userId } = body;

        const result = await QuoteEngine.reviseQuote(parseInt((await params).id, 10), changes, userId);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
