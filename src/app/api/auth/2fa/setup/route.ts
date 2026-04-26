import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { generateTOTPSecret, buildTOTPUri } from '@/lib/totp';

/**
 * POST /api/auth/2fa/setup — Enable 2FA for the current user
 * Returns the TOTP secret + otpauth URI for QR scanning
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const secret = generateTOTPSecret();
        const uri = buildTOTPUri(secret, user.username);

        // Store the secret in the user record (pending until verified)
        await prisma.user.update({
            where: { id: user.userId },
            data: { totpSecret: secret, totpEnabled: false },
        });

        return NextResponse.json({ secret, uri }, { status: 200 });
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

        await prisma.user.update({
            where: { id: user.userId },
            data: { totpSecret: null, totpEnabled: false },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('[2FA Disable]', e);
        return NextResponse.json({ error: 'فشل إلغاء التحقق الثنائي' }, { status: 500 });
    }
}
