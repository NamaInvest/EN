import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/setup — Begin 2FA enrollment for the current user.
 * Returns the TOTP secret + QR image (otpauth URI baked in).
 */
export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { qrCodeImage, secret } = await MfaEngine.enroll(user.userId, 'TOTP');
        return NextResponse.json({ secret, qrCodeImage });
    } catch (e) {
        console.error('[2FA Setup]', e);
        return NextResponse.json({ error: 'فشل إعداد التحقق الثنائي' }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/2fa/setup — Disable 2FA. Caller must have verified TOTP first.
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json().catch(() => ({}));
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
    } catch (e) {
        console.error('[2FA Disable]', e);
        return NextResponse.json({ error: 'فشل إلغاء التحقق الثنائي' }, { status: 500 });
    }
}
