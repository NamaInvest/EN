import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ApprovalEngine } from '@/lib/approval-engine';
import { z } from 'zod';

const Schema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),
});

async function handler(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
  userId: number,
  tenantId: string
) {
  const { id } = await params;
  const requestId = parseInt(id);
  if (isNaN(requestId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const engine = new ApprovalEngine(req);

  if (parsed.data.action === 'APPROVED') {
    const result = await engine.approve({ tenantId, requestId, approverId: userId, notes: parsed.data.notes });
    return NextResponse.json(result);
  } else {
    await engine.reject({ tenantId, requestId, rejectorId: userId, reason: parsed.data.reason ?? 'لا يوجد سبب' });
    return NextResponse.json({ success: true, message: 'تم الرفض' });
  }
}

export const POST = withRoute(
  async (ctx, context) => handler(ctx.req as Request, context, ctx.auth.userId, ctx.auth.tenantId),
  { rateLimit: 'DEFAULT' }
);
