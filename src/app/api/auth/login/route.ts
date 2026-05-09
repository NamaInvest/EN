import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { comparePassword, generateToken } from '@/lib/auth';
import { rateLimitOrReject } from '@/lib/rate-limit';
import { z } from 'zod';


const _POSTSchema = z.object({
  username: z.any().optional(),
  password: z.string().min(1).optional(),
}).passthrough();

async function _POST(request: Request) {
    // Rate limit: max 10 login attempts per minute per IP
    const rateLimitResponse = await rateLimitOrReject(request, { max: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

        // Set HttpOnly cookie for middleware auth
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8, // 8 hours (matches JWT expiry)
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('[Login] Error:', error?.message);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
