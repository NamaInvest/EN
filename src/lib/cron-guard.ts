/**
 * Cron Guard Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * يحمي endpoints التشغيل الآلي من الوصول غير المصرح.
 *
 * طرق التحقق (بالأولوية):
 * 1. Bearer token: Authorization: Bearer <CRON_SECRET>
 * 2. Header مخصص: x-cron-secret: <CRON_SECRET>
 * 3. Vercel Cron: يُضيف authorization تلقائياً من env
 *
 * الإعداد في .env:
 *   CRON_SECRET=your-random-256-bit-hex-string
 *
 * توليد قيمة آمنة:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual, createHmac } from 'crypto';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * يتحقق من أن الطلب مصدره cron daemon معتمد.
 * يعيد null إذا كان الطلب صالحاً، أو NextResponse بـ 401/503 إذا لم يكن.
 */
export function guardCron(req: NextRequest): NextResponse | null {
  // If no secret configured, allow only from localhost (dev mode)
  if (!CRON_SECRET) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const firstIp = ip.split(',')[0].trim();
    const isLocal = firstIp === '127.0.0.1' || firstIp === '::1' || firstIp.startsWith('10.') || firstIp.startsWith('172.');
    if (!isLocal) {
      console.warn('[CRON GUARD] CRON_SECRET not set — blocking non-local request from', firstIp);
      return NextResponse.json(
        { error: 'CRON_SECRET not configured. Set it in .env to enable remote cron execution.' },
        { status: 503 }
      );
    }
    return null; // allow localhost in dev
  }

  // Check Bearer token
  const authHeader  = req.headers.get('authorization') ?? '';
  const cronHeader  = req.headers.get('x-cron-secret') ?? '';
  const token       = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cronHeader;

  if (!token) {
    return NextResponse.json({ error: 'Missing cron authorization' }, { status: 401 });
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(CRON_SECRET);
    const received = Buffer.from(token);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 });
  }

  return null; // authorized
}

/**
 * نسخة أبسط لاستخدام مباشر داخل route handler:
 * const guard = requireCronSecret(req);
 * if (guard) return guard;
 */
export const requireCronSecret = guardCron;
