import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

export const GET = withRoute(async ({ req }) => {
  return NextResponse.json({ status: 'ok', method: 'GET', ts: Date.now() });
}, { rateLimit: 'PUBLIC', requireAuth: false });

export const POST = withRoute(async ({ req }) => {
  return NextResponse.json({ status: 'ok', method: 'POST', ts: Date.now() });
}, { rateLimit: 'PUBLIC', requireAuth: false });
