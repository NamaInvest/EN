import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


const _POSTSchema = z.object({
  notes: z.any().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const requestId = parseInt((await params).id);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { notes, reason } = body;

        // Find the pending step
        const step = await prisma.approvalStep.findFirst({
            where: { requestId, status: 'pending' },
            orderBy: { id: 'asc' }
        });

        if (!step) {
            return NextResponse.json({ error: 'No pending approval steps found' }, { status: 404 });
        }

        // Mark step as rejected
        await prisma.approvalStep.update({
            where: { id: step.id },
            data: { status: 'rejected', notes: `Reason: ${reason}. Notes: ${notes}`, actionDate: new Date() }
        });

        // Mark entire request as rejected
        await prisma.approvalRequest.update({
            where: { id: requestId },
            data: { status: 'rejected' }
        });
        
        // Here you would also update the actual document status (e.g. PurchaseOrder.status = 'REJECTED')

        return NextResponse.json({ success: true, message: 'Request rejected' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
