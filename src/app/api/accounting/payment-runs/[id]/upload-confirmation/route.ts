import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    try {
        const body = await req.json();
        const { userId } = body;
        const runId = parseInt((await params).id, 10);

        const run = await prisma.paymentRun.findUnique({
            where: { id: runId },
            include: { lines: true }
        });

        if (!run || run.status !== 'FILE_GENERATED' && run.status !== 'SENT_TO_BANK') {
            throw new Error("Payment run must be in FILE_GENERATED or SENT_TO_BANK status");
        }

        // Mock parsing bank confirmation
        // In real world, we would parse the uploaded file and update each line status
        for (const line of run.lines) {
            await prisma.paymentRunLine.update({
                where: { id: line.id },
                data: {
                    status: 'CONFIRMED',
                    bankConfirmedAt: new Date(),
                    externalReference: `BANK-REF-${Date.now()}`
                }
            });
        }

        const updatedRun = await prisma.paymentRun.update({
            where: { id: runId },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                confirmedByUserId: userId || 'system',
                successCount: run.lines.length,
                failedCount: 0
            }
        });

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
