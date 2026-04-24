import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getMasterPool = () => new Pool({
    connectionString:
        process.env.MASTER_DB_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
});

/**
 * GET /api/tenant/check-status?userId=clerk_xxx
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
        return NextResponse.json({ provisioned: false }, { status: 400 });
    }

    const pool = getMasterPool();
    try {
        let row: any = null;

        // البحث بـ email أولاً (الأدق — كل إيميل مرتبط بـ tenant واحد)
        if (email) {
            const res = await pool.query(
                `SELECT subdomain, status, org_name FROM tenant_accounts WHERE user_email = $1 LIMIT 1`,
                [email]
            );
            row = res.rows[0] || null;
        }

        // البحث بـ clerk_user_id كـ fallback فقط إذا لم يُعطَ إيميل
        if (!row && userId && !email) {
            const res = await pool.query(
                `SELECT subdomain, status, org_name FROM tenant_accounts WHERE clerk_user_id = $1 LIMIT 1`,
                [userId]
            );
            row = res.rows[0] || null;
        }

        if (row?.subdomain) {
            return NextResponse.json({
                provisioned: true,
                subdomain: row.subdomain,
                status: row.status,
                orgName: row.org_name,
            });
        }

        return NextResponse.json({ provisioned: false });

    } catch (error) {
        console.error('[check-status] DB error:', error);
        return NextResponse.json({ provisioned: false, error: 'db_error' });
    } finally {
        await pool.end().catch(() => { });
    }
}

/**
 * POST /api/tenant/check-status — تحديث clerk_user_id للـ tenant
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const clerkUserId = body.clerkUserId || body.userId;
        const subdomain = body.subdomain;

        if (!clerkUserId || !subdomain) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const pool = getMasterPool();
        try {
            await pool.query(
                `UPDATE tenant_accounts SET clerk_user_id = $1 WHERE subdomain = $2`,
                [clerkUserId, subdomain]
            );
            return NextResponse.json({ success: true });
        } finally {
            await pool.end().catch(() => { });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
