import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


const _PATCHSchema = z.object({
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const stepId = parseInt((await params).id);
        const body = await req.json();

        const _parsed = _PATCHSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { status, notes } = body;

        const updated = await prisma.periodCloseChecklist.update({
            where: { id: stepId },
            data: { 
                status, 
                notes,
                completedAt: status === 'DONE' ? new Date() : null
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const PATCH = withRoute(async ({ req }, context) => _PATCH(req as any, context), { rateLimit: 'DEFAULT' });
