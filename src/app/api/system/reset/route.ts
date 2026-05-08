import { NextResponse } from 'next/server';

// ⚠️ DISABLED: This endpoint has been disabled for security reasons.
// Re-enable only in local development with explicit environment flag.

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
  }
  return NextResponse.json({ message: 'Dev-only endpoint' });
}

export async function POST() {
  return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 403 });
}
