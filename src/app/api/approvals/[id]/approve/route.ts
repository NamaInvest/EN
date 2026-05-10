import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { ApprovalEngine } from '@/lib/approval-engine';
import { getPrisma } from '@/lib/prisma';

const ApproveSchema = z.object({
  notes: z.string().max(1000).optional(),
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
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const engine = new ApprovalEngine(req);
  const result = await engine.approve({
    tenantId,
    requestId,
    approverId: userId,
    notes: parsed.data.notes,
  });

  // If fully approved, update the source document status
  if (result.fullyApproved) {
    const prisma = getPrisma(req) as any;
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      select: { documentType: true, documentId: true },
    });

    if (request) {
      // Map documentType → prisma model + status field
      const docMap: Record<string, { model: string; field: string; value: string }> = {
        PURCHASE_ORDER:  { model: 'purchaseOrder',  field: 'status', value: 'approved' },
        SALES_INVOICE:   { model: 'salesInvoice',   field: 'status', value: 'approved' },
        PAYMENT:         { model: 'paymentRun',     field: 'status', value: 'approved' },
        LEAVE_REQUEST:   { model: 'leaveRequest',   field: 'status', value: 'approved' },
        JOURNAL_ENTRY:   { model: 'journalEntry',   field: 'status', value: 'approved' },
      };

      const mapping = docMap[request.documentType];
      if (mapping && prisma[mapping.model]) {
        await prisma[mapping.model].updateMany({
          where: { id: request.documentId },
          data:  { [mapping.field]: mapping.value },
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    requestId: result.requestId,
    fullyApproved: result.fullyApproved,
    nextLevel: result.nextLevel,
    message: result.fullyApproved
      ? 'تمت الموافقة على الطلب بالكامل'
      : `تمت الموافقة، في انتظار المستوى ${result.nextLevel}`,
  });
}

export const POST = withRoute(
  async (ctx, context) => handler(ctx.req as Request, context, ctx.auth.userId, ctx.auth.tenantId),
  { rateLimit: 'DEFAULT' }
);
