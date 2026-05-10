import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'test' });

export const GET = withRoute(async ({ req }) => {
  return NextResponse.json({ status: 'ok', method: 'GET', ts: Date.now() });
}, { rateLimit: 'PUBLIC', requireAuth: false });

export const POST = withRoute(async ({ req }) => {
  return NextResponse.json({ status: 'ok', method: 'POST', ts: Date.now() });
}, { rateLimit: 'PUBLIC', requireAuth: false });
