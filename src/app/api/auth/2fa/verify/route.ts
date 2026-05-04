import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/verify â€” Verify a TOTP code
 * Used both during setup (to confirm) and during login
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const token = String(body.token || '').trim();
        const userId = body.userId; // For login flow (no JWT yet)

        if (!token || token.length !== 6) {
            return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط؛ظٹط± طµط§ظ„ط­' }, { status: 400 });
        }

        // Determine user: either from JWT (setup flow) or from userId (login flow)
        let uid: number;
        if (userId) {
            uid = Number(userId);
        } else {
            const jwtUser = getUserFromRequest(request);
            if (!jwtUser) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });
            uid = jwtUser.userId;
        }

        const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, totpSecret: true, totpEnabled: true },
        });

        if (!user || !user.totpSecret) {
            return NextResponse.json({ error: 'ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ط«ظ†ط§ط¦ظٹ ط؛ظٹط± ظ…ظپط¹ظ‘ظ„' }, { status: 400 });
        }

        // If 2FA was pending (setup flow), activate it now
        if (!user.totpEnabled) {
            await MfaEngine.verifyAndEnableTOTP(uid, token);
        } else {
            const isValid = await MfaEngine.verifyToken(uid, token);
            if (!isValid) {
                return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط؛ظٹط± طµط­ظٹط­' }, { status: 401 });
            }
        }

        return NextResponse.json({ ok: true, verified: true });
    } catch (e: any) {
        console.error('[2FA Verify]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ ط§ظ„طھط­ظ‚ظ‚' }, { status: e.message === "Invalid TOTP token" ? 401 : 500 });
    }
}
