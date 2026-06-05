import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { NLQEngine } from '@/lib/nlq-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.nlq' });

const _POSTSchema = z.object({
  question: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req, { requireTenant: true });
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.question) return NextResponse.json({ error: 'مطلوب: question' }, { status: 400 });
        const result = await NLQEngine.query(prisma, body.question);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
