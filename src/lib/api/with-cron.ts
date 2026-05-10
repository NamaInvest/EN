/**
 * Cron Job Security Middleware
 *
 * Protects all cron endpoints with HMAC-SHA256 signature verification.
 * External CRON services (Vercel Cron, GitHub Actions, etc.) must include:
 *   Authorization: Bearer <CRON_SECRET>
 * OR:
 *   X-Cron-Signature: <HMAC-SHA256(timestamp:path, CRON_SECRET)>
 *   X-Cron-Timestamp: <unix_timestamp>
 *
 * Usage:
 *   export const POST = withCron(async (req) => { ... });
 *
 * CRON_SECRET must be set in environment variables (min 32 chars).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'WithCron' });

const CRON_SECRET    = process.env.CRON_SECRET ?? '';
const REPLAY_WINDOW  = 5 * 60; // 5 minutes tolerance for timestamp drift

function verifyCronRequest(req: NextRequest): { valid: boolean; reason?: string } {
  // Development bypass (not in production)
  if (process.env.NODE_ENV === 'development' && process.env.CRON_BYPASS === 'true') {
    return { valid: true };
  }

  if (!CRON_SECRET || CRON_SECRET.length < 16) {
    log.error('[CRON] CRON_SECRET not configured or too short');
    return { valid: false, reason: 'Server misconfiguration' };
  }

  // Method 1: Simple Bearer token (compatible with Vercel Cron)
  const authHeader = req.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const valid = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(CRON_SECRET));
    return valid ? { valid: true } : { valid: false, reason: 'Invalid Bearer token' };
  }

  // Method 2: HMAC signature with timestamp (anti-replay)
  const signature = req.headers.get('x-cron-signature') ?? '';
  const timestamp = req.headers.get('x-cron-timestamp') ?? '';

  if (signature && timestamp) {
    const ts  = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);

    if (Math.abs(now - ts) > REPLAY_WINDOW) {
      return { valid: false, reason: 'Timestamp expired (replay protection)' };
    }

    const path     = req.nextUrl.pathname;
    const expected = crypto.createHmac('sha256', CRON_SECRET).update(`${timestamp}:${path}`).digest('hex');
    const match    = crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));

    return match ? { valid: true } : { valid: false, reason: 'Invalid HMAC signature' };
  }

  return { valid: false, reason: 'Missing Authorization or X-Cron-Signature header' };
}

type CronHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse;

export function withCron(handler: CronHandler): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();

    const { valid, reason } = verifyCronRequest(req);
    if (!valid) {
      log.warn(`[CRON] Unauthorized request to ${req.nextUrl.pathname}: ${reason}`);
      return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 });
    }

    try {
      const result = await handler(req);
      const ms = Date.now() - start;
      log.info(`[CRON] ${req.nextUrl.pathname} completed in ${ms}ms`);
      return result;
    } catch (err: any) {
      log.error(`[CRON] ${req.nextUrl.pathname} failed:`, err);
      return NextResponse.json({ error: err.message ?? 'Cron job failed' }, { status: 500 });
    }
  };
}

/** Generate a cron call signature (for testing or CI/CD scripts) */
export function generateCronSignature(path: string, secret: string = CRON_SECRET): { signature: string; timestamp: string } {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}:${path}`).digest('hex');
  return { signature, timestamp };
}
