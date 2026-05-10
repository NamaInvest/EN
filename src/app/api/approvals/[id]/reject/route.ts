import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { ApprovalEngine } from '@/lib/approval-engine';
import { getPrisma } from '@/lib/prisma';

const RejectSchema = z.object({
  reason: z.string().min(5, 'يجب ذكر سبب الرفض').max(1000),
});

async function handler(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
  userId: number,
  tenantId: string
) {
  const { id } = await params;
  const requestId = parseInt(id);
  if (isNaN(requestId)) return NextResponse.json({ error: 'Invalid approval ID' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const engine = new ApprovalEngine(req);
  await engine.reject({
    tenantId,
    requestId,
    rejectorId: userId,
    reason: parsed.data.reason,
  });

  // Update the source document status to 'rejected'
  const prisma = getPrisma(req) as any;
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    select: { documentType: true, documentId: true },
  });

  if (request) {
    const docMap: Record<string, { model: string }> = {
      PURCHASE_ORDER: { model: 'purchaseOrder' },
      SALES_INVOICE:  { model: 'salesInvoice' },
      PAYMENT:        { model: 'paymentRun' },
      LEAVE_REQUEST:  { model: 'leaveRequest' },
      JOURNAL_ENTRY:  { model: 'journalEntry' },
    };
    const mapping = docMap[request.documentType];
    if (mapping && prisma[mapping.model]) {
      await prisma[mapping.model].updateMany({
        where: { id: request.documentId },
        data:  { status: 'rejected' },
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'تم رفض الطلب وإشعار مقدّمه',
  });
}

export const POST = withRoute(
  async (ctx, context) => handler(ctx.req as Request, context, ctx.auth.userId, ctx.auth.tenantId),
  { rateLimit: 'DEFAULT' }
);
