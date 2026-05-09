import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RmaEngine } from '@/lib/rma-engine';
import { z } from 'zod';


const _PUTSchema = z.object({
  approvedBy: z.any().optional(),
}).passthrough();

async function _PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const rma = await RmaEngine.approveRma(parseInt((await params).id, 10), body.approvedBy || 'System');
        return NextResponse.json(rma);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });
