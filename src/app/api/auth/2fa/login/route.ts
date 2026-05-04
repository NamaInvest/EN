import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/login â€” Complete login after 2FA verification
 * Called after user passes password check and receives requires2FA=true
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const userId = Number(body.userId);
        const token = String(body.token || '').trim();

        if (!userId || !token) {
            return NextResponse.json({ error: 'ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط§ظ„ط­ط©' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { permissions: true },
        });

        if (!user || !user.active || !(user as any).totpSecret) {
            return NextResponse.json({ error: 'ظ…ط³طھط®ط¯ظ… ط؛ظٹط± طµط§ظ„ط­' }, { status: 401 });
        }

        // Try TOTP first, if it fails, try Backup Code
        let isValid = await MfaEngine.verifyToken(user.id, token);
        if (!isValid) {
            isValid = await MfaEngine.verifyBackupCode(user.id, token);
        }

        if (!isValid) {
            return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط؛ظٹط± طµط­ظٹط­' }, { status: 401 });
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
        console.error('[2FA Login]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„' }, { status: 500 });
    }
}
