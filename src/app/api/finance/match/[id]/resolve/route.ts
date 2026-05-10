import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ThreeWayMatchEngine } from '@/lib/three-way-match';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.match.id.resolve' });


const _POSTSchema = z.object({
  action: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        await ThreeWayMatchEngine.resolveHold(parseInt((await params).id, 10), body.action, body.userId, body.notes);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
