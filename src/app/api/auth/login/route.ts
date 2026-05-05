import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const username = String(body.username || '').trim();
        const password = String(body.password || '').trim();


        if (!username || !password) {
            return NextResponse.json(
                { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
                { status: 400 }
            );
        }

        // دعم تسجيل الدخول بالبريد الإلكتروني الكامل أو username
        const isEmail = username.includes('@');
        const emailPart = isEmail ? username.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() : null;
        const mode = 'insensitive' as Prisma.QueryMode;
        const user = await prisma.user.findFirst({
            where: isEmail
                ? {
                    OR: [
                        { username: { equals: username, mode } },
                        ...(emailPart ? [{ username: { equals: emailPart, mode } }] : []),
                    ]
                  }
                : { username: { equals: username, mode } },
            include: { permissions: true },
        });

        if (!user || !user.active) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        const isValid = comparePassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // ── 2FA Check ──────────────────────────────────────────────
        if (user.mfaEnabled) {
            return NextResponse.json({
                requires2FA: true,
                userId: user.id,
                message: 'يرجى إدخال رمز التحقق الثنائي',
            }, { status: 200 });
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        const response = NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                defaultPage: (user as any).defaultPage || '',
                permissions: (user as any).permissions ?? [],
            },
        });

        // Set generic auth cookie for Next.js middleware routing
        response.cookies.set('auth-token', token, {
            httpOnly: false, // Must be readable by client script if needed, but primarily used for middleware checks
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        const errDump = JSON.stringify(error, Object.getOwnPropertyNames(error));
        console.error('Login Error Dump:', errDump);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم: ' + errDump },
            { status: 500 }
        );
    }
}
