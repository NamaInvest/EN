import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.2fa.login' });
/**
 * POST /api/auth/2fa/login â€” Complete login after 2FA verification
 * Called after user passes password check and receives requires2FA=true
 */

const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  token: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const userId = Number(body.userId);
        const token = String(body.token || '').trim();

        if (!userId || !token) {
            return NextResponse.json({ error: 'ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط§ظ„ط­ط©' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { permissions: true },
        });

        if (!user || !user.active || !user.mfaEnabled) {
            return NextResponse.json({ error: 'مستخدم غير صالح أو لا يملك ميزة 2FA مفعلة' }, { status: 401 });
        }

        // Try TOTP first, if it fails, try Backup Code
        let isValid = false;
        try {
            isValid = await MfaEngine.verify(user.id, token, 'totp', { ipAddress: request.headers.get('x-forwarded-for') || undefined, userAgent: request.headers.get('user-agent') });
        } catch (e: any) {
            log.error('src/app/api/auth/2fa/login/route.ts', { error: e instanceof Error ? e.message : e });

            // TOTP failed, try backup code
            try {
                isValid = await MfaEngine.verifyBackupCode(user.id, token, { ipAddress: request.headers.get('x-forwarded-for') || undefined, userAgent: request.headers.get('user-agent') });
            } catch (err: any) {
                log.error('src/app/api/auth/2fa/login/route.ts', { error: err instanceof Error ? err.message : err });

                isValid = false;
            }
        }

        if (!isValid) {
            return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
        }

        const jwt = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        const response = NextResponse.json({
            token: jwt,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                defaultPage: (user as any).defaultPage || '',
                permissions: (user as any).permissions ?? [],
            },
        });

        response.cookies.set('auth-token', jwt, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (e: any) {
        log.error('[2FA Login]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
