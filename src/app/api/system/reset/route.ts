import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'system.reset' });

/**
 * 🚨 PERMANENTLY DISABLED — Security remediation (KICKOFF Day 1, Task #3)
 *
 * This endpoint previously allowed system resets.
 * It has been permanently disabled to prevent accidental or malicious data loss.
 * HTTP 410 Gone indicates the resource is intentionally removed.
 *
 * Disabled on: 2026-05-08
 * Reference: IMPROVEMENT_PLAN/KICKOFF.md — اليوم الثاني، المهمة #2
 */

async function _GET() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

async function _POST() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

async function _PUT() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

async function _DELETE() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(), { rateLimit: 'DEFAULT' });
