import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { verifyTOTP } from '@/lib/totp';

/**
 * POST /api/auth/2fa/verify — Verify a TOTP code
 * Used both during setup (to confirm) and during login
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const token = String(body.token || '').trim();
        const userId = body.userId; // For login flow (no JWT yet)

        if (!token || token.length !== 6) {
            return NextResponse.json({ error: 'رمز التحقق غير صالح' }, { status: 400 });
        }

        // Determine user: either from JWT (setup flow) or from userId (login flow)
        let uid: number;
        if (userId) {
            uid = Number(userId);
        } else {
            const jwtUser = getUserFromRequest(request);
            if (!jwtUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
            uid = jwtUser.userId;
        }

        const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, totpSecret: true, totpEnabled: true },
        });

        if (!user || !user.totpSecret) {
            return NextResponse.json({ error: 'التحقق الثنائي غير مفعّل' }, { status: 400 });
        }

        const isValid = verifyTOTP(user.totpSecret, token);
        if (!isValid) {
            return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
        }

        // If 2FA was pending (setup flow), activate it now
        if (!user.totpEnabled) {
            await prisma.user.update({
                where: { id: uid },
                data: { totpEnabled: true },
            });
        }

        return NextResponse.json({ ok: true, verified: true });
    } catch (e: any) {
        console.error('[2FA Verify]', e);
        return NextResponse.json({ error: 'فشل التحقق' }, { status: 500 });
    }
}
