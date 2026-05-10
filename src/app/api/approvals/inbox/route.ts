import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ApprovalEngine } from '@/lib/approval-engine';

/**
 * GET /api/approvals/inbox
 * Returns pending approvals for the authenticated user
 * Supports: ?status=pending|approved|rejected
 */
async function handler(req: Request, userId: number, tenantId: string) {
  const { searchParams } = new URL(req.url);
  const userRole = searchParams.get('role') ?? undefined;

  const engine = new ApprovalEngine(req);
  const items = await engine.getPendingForUser(tenantId, userId, userRole);

  return NextResponse.json({
    count: items.length,
    items,
  });
}

export const GET = withRoute(
  async (ctx) => handler(ctx.req as Request, ctx.auth.userId, ctx.auth.tenantId),
  { rateLimit: 'DEFAULT' }
);
