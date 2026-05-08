import { NextResponse } from 'next/server';

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

export async function GET() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'DISABLED', message: 'This endpoint has been permanently removed.' },
    { status: 410 }
  );
}
