import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

// ⚠️ DISABLED: This endpoint has been disabled for security reasons.
// Re-enable only in local development with explicit environment flag.

async function _GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
  }
  return NextResponse.json({ message: 'Dev-only endpoint' });
}

async function _POST() {
  return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(), { rateLimit: 'DEFAULT' });
