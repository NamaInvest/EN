import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MFAEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/setup — Enable 2FA for the current user
 * Returns the TOTP secret + otpauth URI for QR scanning
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { secret, qrCodeUri } = await MFAEngine.setupTOTP(user.userId, user.username);

        return NextResponse.json({ secret, uri: qrCodeUri }, { status: 200 });
    } catch (e: any) {
        console.error('[2FA Setup]', e);
        return NextResponse.json({ error: 'فشل إعداد التحقق الثنائي' }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/2fa/setup — Disable 2FA for the current user
 */
export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Verify current TOTP before disabling (as per prompt request)
        const body = await request.json().catch(() => ({}));
        const token = body.token;
        if (!token) return NextResponse.json({ error: 'رمز التحقق مطلوب' }, { status: 400 });

        const isValid = await MFAEngine.verifyToken(user.userId, token);
        if (!isValid) return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });

        await prisma.user.update({
            where: { id: user.userId },
            data: { totpSecret: null, totpEnabled: false, totpBackupCodes: [] },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('[2FA Disable]', e);
        return NextResponse.json({ error: 'فشل إلغاء التحقق الثنائي' }, { status: 500 });
    }
}
