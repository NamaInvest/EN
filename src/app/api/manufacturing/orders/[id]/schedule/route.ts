import { NextRequest, NextResponse } from 'next/server';
import { MPSEngine } from '@/lib/mps-engine';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const operation = await MPSEngine.scheduleOperation({
            manufacturingOrderId: parseInt(params.id, 10),
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
