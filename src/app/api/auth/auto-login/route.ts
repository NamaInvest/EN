/**
 * Auto-Login Handler — v2 (Hardened)
 * ═══════════════════════════════════════
 *
 * GET /api/auth/auto-login?token=xxx
 *
 * يستقبل SSO token من sso-redirect ويتحقق من صحته ثم يُسجّل دخول المستخدم تلقائياً.
 *
 * الإصلاحات في v2:
 *  - [#4] حذف الـ hardcoded SSO_SECRET fallback
 *  - تحسين رسائل الخطأ للتشخيص
 *  - إضافة logging مُفصّل
 */

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { createHmac } from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.auto-login' });

/**
 * [#4] الإصلاح الأمني: SSO_SECRET يجب أن يكون موجوداً في البيئة.
 * لا نقبل fallback hardcoded — هذا ثغرة أمنية حرجة.
 */
function getSSOSecret(): string {
    const secret = process.env.SSO_SECRET;
    if (!secret) {
        log.error('[auto-login] CRITICAL: SSO_SECRET environment variable is not set!');
        throw new Error('SSO_SECRET is not configured. Cannot verify tokens.');
    }
    return secret;
}

async function _GET(request: Request) {
    const prisma = getPrisma(request);
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        log.warn('[auto-login] Token missing from request');
        return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    try {
        const ssoSecret = getSSOSecret();

        // Token format: base64(payload).signature
        // ملاحظة: sso-redirect يستخدم `.` كفاصل وليس `:`
        // نتعامل مع كلا الصيغتين للتوافق العكسي
        let payloadB64: string;
        let signature: string;

        if (token.includes(':')) {
            // الصيغة القديمة: base64url(payload):signature
            const parts = token.split(':');
            if (parts.length !== 2) {
                log.warn('[auto-login] Invalid token format (colon separator, wrong parts count)');
                throw new Error('Invalid token format');
            }
            [payloadB64, signature] = parts;
        } else if (token.includes('.')) {
            // الصيغة الجديدة: base64(payload).signature
            const lastDotIndex = token.lastIndexOf('.');
            if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === token.length - 1) {
                log.warn('[auto-login] Invalid token format (dot separator, malformed)');
                throw new Error('Invalid token format');
            }
            payloadB64 = token.substring(0, lastDotIndex);
            signature = token.substring(lastDotIndex + 1);
        } else {
            log.warn('[auto-login] Invalid token format (no separator found)');
            throw new Error('Invalid token format');
        }

        // التحقق من التوقيع
        const expected = createHmac('sha256', ssoSecret).update(payloadB64).digest('hex');
        if (signature !== expected) {
            log.warn('[auto-login] Invalid token signature');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // فك تشفير الـ payload (يدعم base64 و base64url)
        let payloadStr: string;
        try {
            payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
        } catch {
            payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
        }
        const payload = JSON.parse(payloadStr);

        // التحقق من نوع التوكن
        if (payload.type !== 'sso-auto-login') {
            log.warn(`[auto-login] Invalid token type: ${payload.type}`);
            return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
        }

        // التحقق من انتهاء الصلاحية
        if (Date.now() > payload.exp) {
            log.warn('[auto-login] Token expired');
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }

        log.info(`[auto-login] Valid token for email=${payload.email}, subdomain=${payload.subdomain}`);

        // 1. Try finding by email (which might be stored as username in this tenant)
        let targetUser = await prisma.user.findFirst({
            where: { username: payload.email, active: true },
            include: { permissions: true },
        });

        // 2. Fallback to owner or admin
        if (!targetUser) {
            targetUser = await prisma.user.findFirst({
                where: { 
                    OR: [{ role: 'owner' }, { role: 'admin' }],
                    active: true 
                },
                include: { permissions: true },
                orderBy: { id: 'asc' }
            });
        }

        if (!targetUser) {
            log.warn('[auto-login] No active user (owner/admin) found in tenant database');
            return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
        }

        // توليد JWT token
        const jwtToken = generateToken({
            userId: targetUser.id,
            username: targetUser.username,
            role: payload.overrideRole || targetUser.role, // Use overrideRole if present (e.g. Master Panel)
        });

        log.info(`[auto-login] Success: user=${targetUser.username}, role=${targetUser.role}`);
        return NextResponse.json({
            success: true,
            token: jwtToken,
            user: {
                username: targetUser.username,
                role: payload.overrideRole || targetUser.role,
                email: (targetUser as any).email || payload.email
            },
        });

    } catch (err: any) {
        log.error('[auto-login] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH', requireAuth: false });
