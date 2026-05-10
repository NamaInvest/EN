/**
 * GET /api/accounting/fixed-assets — Delegates to /api/fixed-assets
 * Proxy route to fix missing API reports from scanner
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const sp  = ctx.req.nextUrl.searchParams.toString();
  const url = `${ctx.req.nextUrl.origin}/api/fixed-assets${sp ? '?' + sp : ''}`;
  const res = await fetch(url, {
    headers: { cookie: ctx.req.headers.get('cookie') ?? '' },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
