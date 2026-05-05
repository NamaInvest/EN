import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const stepId = parseInt(params.id);
        const body = await req.json();
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
