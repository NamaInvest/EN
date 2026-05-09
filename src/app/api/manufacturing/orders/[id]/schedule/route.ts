import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MPSEngine } from '@/lib/mps-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  operationId: z.union([z.string(), z.number()]).optional(),
  workCenterId: z.union([z.string(), z.number()]).optional(),
  plannedStart: z.any().optional(),
  plannedEnd: z.any().optional(),
  hoursNeeded: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const operation = await MPSEngine.scheduleOperation({
            manufacturingOrderId: parseInt((await params).id, 10),
            operationId: body.operationId,
            workCenterId: body.workCenterId,
            plannedStart: new Date(body.plannedStart),
            plannedEnd: new Date(body.plannedEnd),
            hoursNeeded: body.hoursNeeded
        });
        return NextResponse.json(operation);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
