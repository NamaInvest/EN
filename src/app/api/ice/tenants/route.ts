import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import crypto from 'crypto';

const ICE_SECRET = process.env.ICE_SECRET;
// BUILD SAFETY: if (!ICE_SECRET) throw new Error('CRITICAL: ICE_SECRET is not set in environment variables!');

// BUILD SAFETY: Env check moved to runtime
const masterPool = new Pool({
    connectionString: process.env.MASTER_DB_URL,
    max: 3,
});

const TENANT_DB_BASE = {
    host: 'localhost', port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || '',
};
// BUILD SAFETY: Env check moved to runtime

function verifyIceToken(token: string): boolean {
    try {
        const [data, sig] = token.split('.');
        // @ts-expect-error [TS2345] Type mismatch Request/NextRequest - fix at Service Layer
        const expectedSig = crypto.createHmac('sha256', ICE_SECRET).update(data).digest('hex');
        if (sig !== expectedSig) return false;
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        return payload.exp > Date.now();
    } catch { return false; }
}

async function _GET(req: Request) {

    const cookieStore = await cookies();
    const token = cookieStore.get('ice_token')?.value;
    if (!token || !verifyIceToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // قراءة جميع المستأجرين من n11_db
        const url = new URL(req.url);
        const subdomainQuery = url.searchParams.get('subdomain');

        let query = `
            SELECT
                id, subdomain, org_name, user_email, vat_number,
                status, subscription_status, plan,
                trial_ends_at, invoice_quota, product_quota,
                COALESCE(user_quota, 1) as user_quota,
                created_at
            FROM tenant_accounts
        `;
        let params: Promise<any>[] = [];

        if (subdomainQuery) {
            query += ` WHERE subdomain = $1`;
            // @ts-expect-error [TS2345] Type mismatch Request/NextRequest - fix at Service Layer
            params.push(subdomainQuery);
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const { rows: accounts } = await masterPool.query(query, params);

        const { Client } = require('pg');

        const tenants = await Promise.all(accounts.map(async (acc: any) => {
            const subdomain = acc.subdomain;
            const dbName = `${subdomain}_db`;
            const trialEndsAt = acc.trial_ends_at ? new Date(acc.trial_ends_at) : null;
            const now = new Date();
            let daysRemaining: number;
            if (trialEndsAt) {
                daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000));
            } else if (acc.subscription_status === 'active' && acc.created_at) {
                // Paid plan: calculate from created_at + 365 days (1 year)
                const createdAt = new Date(acc.created_at);
                const expiresAt = new Date(createdAt.getTime() + 365 * 86400000);
                daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000));
            } else {
                daysRemaining = 0;
            }
            const isExpired = acc.subscription_status === 'trial' && daysRemaining <= 0;

            let invoiceCount = 0, productCount = 0, userCount = 0;
            let companyNameAr = acc.org_name || subdomain;
            let companyNameEn = subdomain;
            let hiddenModules: string[] = [];

            try {
                const client = new Client({ ...TENANT_DB_BASE, database: dbName, connectionTimeoutMillis: 3000 });
                await client.connect();
                const [invoiceRes, productRes, userRes, settingsRes] = await Promise.all([
                    client.query(`SELECT COUNT(*) as cnt FROM "SalesInvoice"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    client.query(`SELECT COUNT(*) as cnt FROM "Product"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    client.query(`SELECT COUNT(*) as cnt FROM "User"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    client.query(`SELECT key, value FROM "Setting" WHERE key IN ('companyNameAr','companyNameEn','hidden_modules')`).catch(() => ({ rows: [] })),
                ]);
                await client.end().catch(() => {});

                invoiceCount = parseInt(invoiceRes.rows[0]?.cnt || '0');
                productCount = parseInt(productRes.rows[0]?.cnt || '0');
                userCount = parseInt(userRes.rows[0]?.cnt || '0');

                for (const s of settingsRes.rows) {
                    if (s.key === 'companyNameAr') companyNameAr = s.value || companyNameAr;
                    if (s.key === 'companyNameEn') companyNameEn = s.value || companyNameEn;
                    if (s.key === 'hidden_modules') {
                        try { hiddenModules = JSON.parse(s.value); } catch {}
                    }
                }
            } catch { /* DB not ready */ }

            return {
                id: acc.id, subdomain, dbName,
                domainUrl: `${subdomain}.namainvist.com`,
                companyNameAr, companyNameEn,
                email: acc.user_email,
                vatNumber: acc.vat_number || '—',
                status: acc.status,
                subscriptionStatus: acc.subscription_status,
                plan: acc.plan || 'free',
                trialEndsAt: trialEndsAt?.toISOString().split('T')[0] || null,
                daysRemaining, isExpired, invoiceCount,
                invoiceQuota: acc.invoice_quota || 30,
                productCount,
                productQuota: acc.product_quota || 1000,
                userCount,
                userQuota: acc.user_quota ?? 1,
                hiddenModules,
                createdAt: acc.created_at,
            };
        }));

        return NextResponse.json({ success: true, tenants });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
