import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Pool } from 'pg';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const masterPool = new Pool({
    connectionString: process.env.MASTER_DB_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
    max: 3,
});

const tenantPool = (dbName: string) => new Pool({
    host: 'localhost', port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || 'RootPassNama123',
    database: dbName, max: 2,
});

async function verifyOwner(userId: string): Promise<boolean> {
    try {
        const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
        const u = await res.json();
        const email = u?.email_addresses?.[0]?.email_address || '';
        return email === OWNER_EMAIL;
    } catch { return false; }
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyOwner(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        // قراءة جميع المستأجرين من n11_db
        const { rows: accounts } = await masterPool.query(`
            SELECT
                id, subdomain, org_name, user_email, vat_number,
                status, subscription_status, plan,
                trial_ends_at, invoice_quota, product_quota,
                COALESCE(user_quota, 1) as user_quota,
                created_at
            FROM tenant_accounts
            ORDER BY created_at DESC
        `);

        const tenants = [];

        for (const acc of accounts) {
            const subdomain = acc.subdomain;
            const dbName = `${subdomain}_db`;

            // حساب الأيام المتبقية
            const trialEndsAt = acc.trial_ends_at ? new Date(acc.trial_ends_at) : null;
            const now = new Date();
            const daysRemaining = trialEndsAt
                ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000))
                : 999;
            const isExpired = acc.subscription_status === 'trial' && daysRemaining <= 0;

            // جلب بيانات من tenant DB
            let invoiceCount = 0;
            let productCount = 0;
            let userCount = 0;
            let companyNameAr = acc.org_name || subdomain;
            let companyNameEn = subdomain;
            let hiddenModules: string[] = [];

            try {
                const pool = tenantPool(dbName);
        const [invoiceRes, productRes, userRes, settingsRes] = await Promise.all([
                    pool.query(`SELECT COUNT(*) as cnt FROM "SalesInvoice"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    pool.query(`SELECT COUNT(*) as cnt FROM "Product"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    pool.query(`SELECT COUNT(*) as cnt FROM "User"`).catch(() => ({ rows: [{ cnt: '0' }] })),
                    pool.query(`SELECT key, value FROM "Setting" WHERE key IN ('companyNameAr','companyNameEn','hidden_modules')`).catch(() => ({ rows: [] })),
                ]);
                await pool.end().catch(() => {});

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
            } catch { /* DB لم تُهيَّأ بعد */ }

            tenants.push({
                id: acc.id,
                subdomain,
                dbName,
                domainUrl: `${subdomain}.namainvist.com`,
                companyNameAr,
                companyNameEn,
                email: acc.user_email,
                vatNumber: acc.vat_number || '—',
                status: acc.status,
                subscriptionStatus: acc.subscription_status,
                plan: acc.plan || 'free',
                trialEndsAt: trialEndsAt?.toISOString().split('T')[0] || null,
                daysRemaining,
                isExpired,
                invoiceCount,
                invoiceQuota: acc.invoice_quota || 30,
                productCount,
                productQuota: acc.product_quota || 1000,
                userCount,
                userQuota: acc.user_quota ?? 1,
                hiddenModules,
                createdAt: acc.created_at,
            });
        }

        return NextResponse.json({ success: true, tenants });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
