import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.mfa.enroll' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  method: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId, method } = body;
        if (!userId || !method) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const result = await MfaEngine.enroll(userId, method);
        return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
