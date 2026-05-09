import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MPSEngine } from '@/lib/mps-engine';

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
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
