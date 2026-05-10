import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { MfaEngine } from '@/lib/mfa-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.2fa.setup' });
/**
 * POST /api/auth/2fa/setup — Begin 2FA enrollment for the current user.
 * Returns the TOTP secret + QR image (otpauth URI baked in).
 */

const _POSTSchema = z.object({
  token: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { qrCodeImage, secret } = await MfaEngine.enroll(user.userId, 'TOTP');
        return NextResponse.json({ secret, qrCodeImage });
    } catch (e: any) {
        log.error('[2FA Setup]', e);
        return NextResponse.json({ error: 'فشل إعداد التحقق الثنائي' }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/2fa/setup — Disable 2FA. Caller must have verified TOTP first.
 */
async function _DELETE(request: NextRequest) {
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const token = body.token;
        if (!token) return NextResponse.json({ error: 'رمز التحقق مطلوب' }, { status: 400 });

        // Verify before disabling
        try {
            await MfaEngine.verify(user.userId, token, 'totp');
        } catch {
            return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
        }

        await MfaEngine.disable(user.userId);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        log.error('[2FA Disable]', e);
        return NextResponse.json({ error: 'فشل إلغاء التحقق الثنائي' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'AUTH' });
