import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    try {
        const requestId = parseInt((await params).id);
        const body = await req.json();
        const { notes } = body;

        // Find the pending step
        const step = await prisma.approvalStep.findFirst({
            where: { requestId, status: 'pending' },
            orderBy: { id: 'asc' }
        });

        if (!step) {
            return NextResponse.json({ error: 'No pending approval steps found' }, { status: 404 });
        }

        // Mark step as approved
        await prisma.approvalStep.update({
            where: { id: step.id },
            data: { status: 'approved', notes, actionDate: new Date() }
        });

        // Check if all steps are approved
        const remainingSteps = await prisma.approvalStep.count({
            where: { requestId, status: 'pending' }
        });

        if (remainingSteps === 0) {
            await prisma.approvalRequest.update({
                where: { id: requestId },
                data: { status: 'approved' }
            });
            // Here you would also update the actual document status (e.g. PurchaseOrder.status = 'APPROVED')
        }

        return NextResponse.json({ success: true, message: 'Approval step processed' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
