import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * POST /api/auth/login-by-email
 * 
 *      (  )
 *   :        subdomain 
 */
async function _POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: '  ' }, { status: 400 });
        }

        // ??   subdomain    host ???????????????????????
        const host = req.headers.get('host') || '';
        const currentSubdomain = host.split('.')[0]; // ahmedalyamicompany

        // ??  :       subdomain ؿ ??
        const masterPool = getMasterPool();
        try {
            const result = await masterPool.query(
                `SELECT subdomain FROM tenant_accounts WHERE user_email = $1 LIMIT 1`,
                [email]
            );
            const registeredSubdomain = result.rows[0]?.subdomain;

            if (!registeredSubdomain) {
                //      tenant
                return NextResponse.json(
                    { error: '      ' },
                    { status: 403 }
                );
            }

            if (registeredSubdomain !== currentSubdomain) {
                //    subdomain 
                console.warn(`[login-by-email] BLOCKED: email=${email} belongs to ${registeredSubdomain}, tried to access ${currentSubdomain}`);
                return NextResponse.json(
                    { 
                        error: '      ',
                        redirect: `https://${registeredSubdomain}.namainvist.com/auto-login`,
                    },
                    { status: 403 }
                );
            }
        } finally {
            await masterPool.end().catch(() => {});
        }

        // ??   ?   ?????????????????????????????????????
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
            return NextResponse.json({ error: '   ' }, { status: 404 });
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
        return NextResponse.json({ error: '  ' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
