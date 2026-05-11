import { logger } from '@/lib/logger';

const log = logger.child({ route: 'auth/sso-redirect' });

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { createHmac } from 'crypto';
import { Pool } from 'pg';
import { clerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';

const getMasterPool = () => {
    if (!process.env.MASTER_DB_URL) throw new Error('MASTER_DB_URL is required');
    return new Pool({
        connectionString: process.env.MASTER_DB_URL,
        max: 2,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 3000,
    });
};

/**
 * GET /api/auth/sso-redirect?userId=clerk_xxx
 * 
 * 1. يجلب الإيميل من Clerk Backend API
 * 2. يبحث عن الـ tenant بالإيميل (كل إيميل مرتبط بـ tenant واحد فقط)
 * 3. يولّد SSO token ويحوّل المستخدم للـ subdomain الصحيح
 */
async function _GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // خطوة 1: جلب الإيميل من Clerk
    let email = '';
    try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        const primaryEmailId = user.primaryEmailAddressId;
        const primaryEmail = user.emailAddresses.find((e: any) => e.id === primaryEmailId);
        email = primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || '';
        log.info(`[sso-redirect] userId=${userId}, email=${email}`);
    } catch (e: any) {
        log.error('[sso-redirect] Failed to get Clerk user:', e.message);
        return NextResponse.redirect(new URL('/login?error=clerk-failed', req.url));
    }

    if (!email) {
        return NextResponse.redirect(new URL('/login?error=no-email', req.url));
    }

    // خطوة 2: البحث عن الـ tenant بالإيميل
    const pool = getMasterPool();
    try {
        const res = await pool.query(
            `SELECT subdomain, status FROM tenant_accounts WHERE user_email = $1 LIMIT 1`,
            [email]
        );
        
        const tenant = res.rows[0];
        
        if (!tenant?.subdomain) {
            // إيميل جديد → صفحة إنشاء شركة
            log.info(`[sso-redirect] No tenant for email=${email}, redirecting to company-info`);
            return NextResponse.redirect(new URL('/company-info', req.url));
        }

        // خطوة 3: توليد SSO token بصيغة HMAC
        const payload = {
            type: 'sso-auto-login',
            clerkUserId: userId,
            email,
            subdomain: tenant.subdomain,
            exp: Date.now() + (5 * 60 * 1000),
        };
        
        const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = createHmac('sha256', SSO_SECRET).update(payloadB64).digest('hex');
        const ssoToken = `${payloadB64}:${signature}`;

        // خطوة 4: التحويل للـ subdomain الصحيح
        const targetUrl = `https://${tenant.subdomain}.namainvist.com/auto-login?token=${encodeURIComponent(ssoToken)}`;
        log.info(`[sso-redirect] email=${email} → ${tenant.subdomain}`);
        return NextResponse.redirect(targetUrl);

    } catch (error: any) {
        log.error('[sso-redirect] DB Error:', error);
        return NextResponse.redirect(new URL('/login?error=db-error', req.url));
    } finally {
        await pool.end().catch(() => {});
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH', requireAuth: false });
