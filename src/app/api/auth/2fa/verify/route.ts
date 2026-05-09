import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { MfaEngine } from '@/lib/mfa-engine';

import { getUserFromRequest } from '@/lib/auth';
/**
 * POST /api/auth/2fa/verify — Verify a TOTP code.
 * Used both during setup (to confirm enrollment) and during login.
 */
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const token = String(body.token || '').trim();
        const userId = body.userId;

        if (!token || token.length !== 6) {
            return NextResponse.json({ error: 'رمز التحقق غير صالح' }, { status: 400 });
        }

        let uid: number;
        if (userId) {
            uid = Number(userId);
        } else {
            const jwtUser = getUserFromRequest(request as any);
            if (!jwtUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
            uid = jwtUser.userId;
        }

        const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, totpSecretEncrypted: true, mfaEnabled: true, mfaPendingActivation: true },
        });
        if (!user || !user.totpSecretEncrypted) {
            return NextResponse.json({ error: 'التحقق الثنائي غير مفعّل' }, { status: 400 });
        }

        // If still in enrollment, confirm; else verify
        try {
            if (user.mfaPendingActivation && !user.mfaEnabled) {
                await MfaEngine.confirmEnrollment(uid, token);
            } else {
                await MfaEngine.verify(uid, token, 'totp');
            }
        } catch (err: any) {
            const msg = (err as Error).message || '';
            const status = msg.includes('Invalid') || msg.includes('locked') ? 401 : 500;
            return NextResponse.json({ error: msg || 'فشل التحقق' }, { status });
        }

        return NextResponse.json({ ok: true, verified: true });
    } catch (e: any) {
        console.error('[2FA Verify]', e);
        return NextResponse.json({ error: 'فشل التحقق' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
