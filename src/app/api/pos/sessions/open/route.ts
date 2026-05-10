import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PosSessionEngine } from '@/lib/pos-session-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.sessions.open' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  terminalId: z.union([z.string(), z.number()]).optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
  openingFloat: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId, terminalId, branchId, openingFloat } = body;
        
        if (!userId || !terminalId) {
            return NextResponse.json({ error: 'userId and terminalId are required' }, { status: 400 });
        }

        const session = await PosSessionEngine.openSession(
            parseInt(userId, 10),
            parseInt(terminalId, 10),
            branchId ? parseInt(branchId, 10) : 1,
            parseFloat(openingFloat || 0)
        );

        return NextResponse.json(session);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
