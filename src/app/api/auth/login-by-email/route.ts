import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getMasterPool = () => new Pool({
    connectionString: process.env.MASTER_DB_URL || 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
});

/**
 * POST /api/auth/login-by-email
 * 
 * تسجيل دخول عبر البريد الإلكتروني (بدون كلمة سر)
 * شرط أمان صارم: الإيميل يجب أن يكون مسجلاً لهذا الـ subdomain تحديداً
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
        }

        // ── تحديد الـ subdomain الحالي من الـ host ───────────────────────
        const host = req.headers.get('host') || '';
        const currentSubdomain = host.split('.')[0]; // ahmedalyamicompany

        // ── التحقق الأمني: هل هذا الإيميل مسجّل لهذا الـ subdomain فقط؟ ──
        const masterPool = getMasterPool();
        try {
            const result = await masterPool.query(
                `SELECT subdomain FROM tenant_accounts WHERE user_email = $1 LIMIT 1`,
                [email]
            );
            const registeredSubdomain = result.rows[0]?.subdomain;

            if (!registeredSubdomain) {
                // الإيميل مو مسجّل في أي tenant
                return NextResponse.json(
                    { error: 'هذا البريد الإلكتروني غير مسجّل في النظام' },
                    { status: 403 }
                );
            }

            if (registeredSubdomain !== currentSubdomain) {
                // الإيميل مسجّل في subdomain مختلف
                console.warn(`[login-by-email] BLOCKED: email=${email} belongs to ${registeredSubdomain}, tried to access ${currentSubdomain}`);
                return NextResponse.json(
                    { 
                        error: 'هذا البريد الإلكتروني مسجّل في حساب آخر',
                        redirect: `https://${registeredSubdomain}.namainvist.com/auto-login`,
                    },
                    { status: 403 }
                );
            }
        } finally {
            await masterPool.end().catch(() => {});
        }

        // ── الإيميل صحيح → سجّل دخول ─────────────────────────────────────
        const prisma = await getPrisma(req);
        const emailUsername = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase();

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: emailUsername },
                    { username: 'admin' },
                    { role: 'admin' },
                ],
                active: true,
            },
            orderBy: { username: 'asc' },
        });

        if (!user) {
            return NextResponse.json({ error: 'لم يُعثر على مستخدم' }, { status: 404 });
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                email,
                defaultPage: (user as any).defaultPage || '',
                permissions: (user as any).permissions || [],
            },
        });

    } catch (err: any) {
        console.error('[login-by-email]', err.message);
        return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
    }
}
