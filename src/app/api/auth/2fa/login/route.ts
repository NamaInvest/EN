import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { MFAEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/login — Complete login after 2FA verification
 * Called after user passes password check and receives requires2FA=true
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const userId = Number(body.userId);
        const token = String(body.token || '').trim();

        if (!userId || !token) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { permissions: true },
        });

        if (!user || !user.active || !(user as any).totpSecret) {
            return NextResponse.json({ error: 'مستخدم غير صالح' }, { status: 401 });
        }

        // Try TOTP first, if it fails, try Backup Code
        let isValid = await MFAEngine.verifyToken(user.id, token);
        if (!isValid) {
            isValid = await MFAEngine.verifyBackupCode(user.id, token);
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
        console.error('[2FA Login]', e);
        return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 });
    }
}
