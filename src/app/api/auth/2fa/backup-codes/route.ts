import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.2fa.backup-codes' });
/**
 * POST /api/auth/2fa/backup-codes — Regenerate backup codes (invalidates old set)
 */

const _POSTSchema = z.object({
  token: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
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

        // Verify before regenerating
        try {
            await MfaEngine.verify(user.userId, token, 'totp');
        } catch {
            return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
        }

        const codes = await MfaEngine.regenerateBackupCodes(user.userId);
        return NextResponse.json({ codes });
    } catch (e: any) {
        log.error('[2FA Backup Codes]', e);
        return NextResponse.json({ error: 'فشل إنشاء رموز الاحتياط' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
