/**
 * SSO Redirect Handler — v4 (Hardened)
 * ═══════════════════════════════════════
 *
 * GET /api/auth/sso-redirect?userId=clerk_xxx
 *
 * تدفق العمل:
 *  1. يستخرج الـ userId من Clerk auth(), searchParams, أو __session cookie
 *  2. يجلب الإيميل من Clerk Backend API
 *  3. يبحث عن الـ tenant بالإيميل في الـ Master DB
 *  4. يولّد SSO token ويحوّل المستخدم للـ subdomain الصحيح
 *
 * الإصلاحات في v4:
 *  - [#1]  إضافة loop detection header لمنع حلقة إعادة التوجيه
 *  - [#2]  حذف الـ hardcoded SSO_SECRET fallback — يرمي خطأ إذا غير موجود
 *  - [#3]  Singleton Connection Pool بدلاً من إنشاء pool جديد كل طلب
 *  - [#11] الـ pool لم يعد يُغلق بعد كل طلب (singleton)
 *  - [#14] إصلاح variable shadowing في find callback
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'auth/sso-redirect' });

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { createHmac } from 'crypto';
import { Pool } from 'pg';
import { clerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * [#2] الإصلاح الأمني: SSO_SECRET يجب أن يكون موجوداً في البيئة.
 * لا نقبل fallback hardcoded — هذا ثغرة أمنية حرجة.
 * نقرأ القيمة lazily عند أول استخدام لتفادي crash وقت التحميل.
 */
function getSSOSecret(): string {
    const secret = process.env.SSO_SECRET;
    if (!secret) {
        log.error('[sso-redirect] CRITICAL: SSO_SECRET environment variable is not set!');
        throw new Error('SSO_SECRET is not configured. Cannot generate secure tokens.');
    }
    return secret;
}

/**
 * [#3 + #11] Singleton Connection Pool.
 * يُنشأ مرة واحدة فقط ويُعاد استخدامه عبر كل الطلبات.
 * الـ pool يدير idle connections تلقائياً ولا يحتاج إغلاق يدوي.
 */
let masterPool: Pool | null = null;

function getMasterPool(): Pool {
    if (!process.env.MASTER_DB_URL) {
        throw new Error('MASTER_DB_URL is required for SSO redirect');
    }
    if (!masterPool) {
        masterPool = new Pool({
            connectionString: process.env.MASTER_DB_URL,
            max: 5,                    // كافي لـ SSO traffic (ليس عالي التردد)
            idleTimeoutMillis: 30000,  // 30 ثانية قبل إغلاق الاتصال الخامل
            connectionTimeoutMillis: 5000, // 5 ثواني timeout للاتصال
        });
        // تسجيل أخطاء الـ pool بدلاً من تركها تُسقط العملية
        masterPool.on('error', (err) => {
            log.error('[sso-redirect] Pool idle client error:', err.message);
        });
    }
    return masterPool;
}

/**
 * [#1] Loop Detection:
 * نستخدم cookie مؤقت لتتبع عدد محاولات الـ redirect.
 * إذا تجاوز 3 محاولات خلال 60 ثانية = حلقة ← نوقف ونعرض صفحة خطأ.
 */
const MAX_REDIRECT_ATTEMPTS = 3;
const LOOP_COOKIE_NAME = 'sso_redirect_attempts';
const MASTER_OWNER_EMAILS = [
    process.env.ICE_OWNER_EMAIL,
    process.env.MASTER_OWNER_EMAIL,
    process.env.MASTER_ADMIN_EMAIL,
].filter(Boolean).map((value) => String(value).trim().toLowerCase());

function getRedirectAttempts(req: Request): number {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${LOOP_COOKIE_NAME}=(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
}

async function _GET(req: Request) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'namainvist.com';
    // إصلاح: إذا Nginx يرسل localhost:3500 كـ host
    const finalHost = host.includes('localhost') ? 'namainvist.com' : host;
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${finalHost}`;

    // ── [#1] Loop Detection ────────────────────────────────────────────────
    const attempts = getRedirectAttempts(req);
    if (attempts >= MAX_REDIRECT_ATTEMPTS) {
        log.error(`[sso-redirect] Loop detected! ${attempts} attempts. Breaking loop.`);
        // نعيد صفحة HTML بسيطة بدلاً من redirect آخر لكسر الحلقة
        const htmlResponse = new Response(
            `<!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head><meta charset="utf-8"><title>خطأ في تسجيل الدخول</title></head>
            <body style="font-family: 'Noto Sans Arabic', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; text-align: center; flex-direction: column; gap: 16px;">
                <div style="font-size: 48px;">⚠️</div>
                <h1 style="font-size: 24px; margin: 0;">حدث خطأ في تسجيل الدخول</h1>
                <p style="color: #94a3b8; max-width: 400px;">تم اكتشاف حلقة إعادة توجيه. يرجى مسح ملفات تعريف الارتباط (Cookies) وإعادة المحاولة.</p>
                <a href="/login" onclick="document.cookie='${LOOP_COOKIE_NAME}=0; path=/; max-age=0';" style="background: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">إعادة المحاولة</a>
            </body>
            </html>`,
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    // مسح cookie الحلقة عند عرض صفحة الخطأ
                    'Set-Cookie': `${LOOP_COOKIE_NAME}=0; Path=/; Max-Age=0; SameSite=Lax`,
                },
            }
        );
        return htmlResponse;
    }

    // ── استخراج userId من Clerk ───────────────────────────────────────────
    let userId: string | null = null;
    try {
        // Next.js App Router native Clerk auth check
        const { auth } = await import('@clerk/nextjs/server');
        const authObj = await auth();
        userId = authObj.userId;
    } catch (err) {
        log.error('[sso-redirect] Clerk auth() failed', err);
    }

    if (!userId) {
        // Fallback: searchParams
        const { searchParams } = new URL(req.url);
        userId = searchParams.get('userId');
    }

    if (!userId) {
        // Fallback: يدوياً من __session cookie لأن clerkMiddleware قد يكون غير مفعّل
        const cookieHeader = req.headers.get('cookie') || '';
        log.info(`[sso-redirect] Fallback cookie parsing. Cookies present: ${cookieHeader.length > 0}`);

        const match = cookieHeader.match(/__session=([^;]+)/);
        if (match) {
            try {
                const sessionToken = match[1];
                const payloadBase64 = sessionToken.split('.')[1];
                const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
                const payload = JSON.parse(payloadStr);
                if (payload.sub) {
                    userId = payload.sub;
                    log.info(`[sso-redirect] Extracted userId from __session cookie: ${userId}`);
                }
            } catch (parseErr) {
                // [#14] إصلاح: استخدام اسم متغير مختلف بدلاً من `e` لتفادي shadowing
                log.error('[sso-redirect] Failed to parse __session cookie', parseErr);
            }
        }
    }

    if (!userId) {
        log.error('[sso-redirect] No userId found. Redirecting to /login?error=no-userid');
        // [#1] نزيد عداد المحاولات في cookie
        const newAttempts = attempts + 1;
        const response = NextResponse.redirect(new URL('/login?error=no-userid', baseUrl));
        response.cookies.set(LOOP_COOKIE_NAME, String(newAttempts), {
            path: '/',
            maxAge: 60, // تنتهي صلاحيته بعد 60 ثانية
            sameSite: 'lax',
        });
        return response;
    }

    // ── userId موجود → مسح عداد الحلقة ────────────────────────────────────
    // (سيتم تعيين الـ cookie في الـ response الناجح)

    // ── خطوة 1: جلب الإيميل من Clerk Backend API ─────────────────────────
    let email = '';
    try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const primaryEmailId = clerkUser.primaryEmailAddressId;
        // [#14] إصلاح: استخدام `addr` بدلاً من `e` لتفادي variable shadowing
        const primaryEmail = clerkUser.emailAddresses.find(
            (addr: any) => addr.id === primaryEmailId
        );
        email = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';
        log.info(`[sso-redirect] userId=${userId}, email=${email}`);
    } catch (clerkErr: any) {
        log.error('[sso-redirect] Failed to get Clerk user:', clerkErr.message);
        const response = NextResponse.redirect(new URL('/login?error=clerk-failed', baseUrl));
        response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
        return response;
    }

    if (!email) {
        const response = NextResponse.redirect(new URL('/login?error=no-email', baseUrl));
        response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
        return response;
    }

    // ── خطوة 2: البحث في الـ Master DB ──────────────────────────────────
    const pool = getMasterPool();
    try {
        // هل هذا المستخدم هو مالك منصة NamaInvest؟
        // جدول users لا يحتوي عمود email في schema الحالي، لذلك نعتمد على إعدادات البيئة بدلاً من استعلام مكسور.
        if (MASTER_OWNER_EMAILS.includes(email.toLowerCase())) {
            const { generateToken } = await import('@/lib/auth');
            const jwtToken = generateToken({
                userId: 0,
                username: email,
                role: 'owner',
            });
            log.info(`[sso-redirect] Platform owner matched for email=${email}, redirecting to master-panel`);
            const response = NextResponse.redirect(new URL('/master-panel', baseUrl));
            response.cookies.set('token', jwtToken, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
                sameSite: 'lax',
                secure: protocol === 'https',
            });
            response.cookies.set('master_token', 'SECURE_MASTER_VALIDATED', {
                path: '/',
                maxAge: 60 * 60 * 24,
                sameSite: 'lax',
                secure: protocol === 'https',
                httpOnly: true,
            });
            // مسح عداد الحلقة عند النجاح
            response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
            return response;
        }

        // خطوة 3: البحث عن الـ tenant بالإيميل
        const tenantRes = await pool.query(
            `SELECT subdomain, status FROM tenant_accounts WHERE user_email = $1 OR clerk_user_id = $2 LIMIT 1`,
            [email, userId]
        );
        const tenant = tenantRes.rows[0];

        if (tenant?.subdomain) {
            // القانون الثاني: صاحب الشركة (لديه Subdomain) → دخول تلقائي
            log.info(`[sso-redirect] Tenant matched for email=${email} → ${tenant.subdomain}. Generating Auto-Login token.`);

            const ssoSecret = getSSOSecret();
            const ssoToken = Buffer.from(JSON.stringify({
                email,
                userId,
                subdomain: tenant.subdomain,
                type: 'sso-auto-login',
                exp: Date.now() + 1000 * 60 * 5, // 5 دقائق صلاحية
            })).toString('base64');

            const signature = createHmac('sha256', ssoSecret).update(ssoToken).digest('hex');
            const fullToken = `${ssoToken}.${signature}`;

            const response = NextResponse.redirect(
                `https://${tenant.subdomain}.namainvist.com/auto-login?token=${encodeURIComponent(fullToken)}`
            );
            // مسح عداد الحلقة عند النجاح
            response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
            return response;
        }

        // القانون الثالث: إيميل جديد → صفحة إنشاء شركة
        log.info(`[sso-redirect] New email=${email}, redirecting to company-info`);
        const response = NextResponse.redirect(new URL('/company-info', baseUrl));
        response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
        return response;

    } catch (dbError: any) {
        log.error('[sso-redirect] DB Error:', dbError);
        const response = NextResponse.redirect(new URL('/login?error=db-error', baseUrl));
        response.cookies.set(LOOP_COOKIE_NAME, '0', { path: '/', maxAge: 0 });
        return response;
    }
    // [#11] لا نُغلق الـ pool هنا — هو singleton يُدار ذاتياً
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH', requireAuth: false });
