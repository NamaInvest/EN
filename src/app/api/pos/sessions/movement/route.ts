import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PosSessionEngine } from '@/lib/pos-session-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  sessionId: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  amount: z.number().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { sessionId, type, amount, reason } = body;
        
        if (!sessionId || !type || !amount) {
            return NextResponse.json({ error: 'sessionId, type, and amount are required' }, { status: 400 });
        }

        const movement = await PosSessionEngine.addMovement(
            parseInt(sessionId, 10),
            type,
            parseFloat(amount),
            reason
        );

        return NextResponse.json(movement);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
