import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/setup â€” Enable 2FA for the current user
 * Returns the TOTP secret + otpauth URI for QR scanning
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });

        const { secret, qrCodeUri } = await MfaEngine.setupTOTP(user.userId, user.username);

        return NextResponse.json({ secret, uri: qrCodeUri }, { status: 200 });
    } catch (e: any) {
        console.error('[2FA Setup]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ ط¥ط¹ط¯ط§ط¯ ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ط«ظ†ط§ط¦ظٹ' }, { status: 500 });
    }
}

/**
 * DELETE /api/auth/2fa/setup â€” Disable 2FA for the current user
 */
export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });

        // Verify current TOTP before disabling (as per prompt request)
        const body = await request.json().catch(() => ({}));
        const token = body.token;
        if (!token) return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ظ…ط·ظ„ظˆط¨' }, { status: 400 });

        const isValid = await MfaEngine.verifyToken(user.userId, token);
        if (!isValid) return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط؛ظٹط± طµط­ظٹط­' }, { status: 401 });

        await prisma.user.update({
            where: { id: user.userId },
            data: { totpSecret: null, totpEnabled: false, totpBackupCodes: [] },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('[2FA Disable]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ ط¥ظ„ط؛ط§ط، ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ط«ظ†ط§ط¦ظٹ' }, { status: 500 });
    }
}
