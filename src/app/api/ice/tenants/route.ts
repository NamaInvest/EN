import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import crypto from 'crypto';

const ICE_SECRET = process.env.ICE_SECRET || 'ice_admin_secret_nama_2026_x9k';

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

function verifyIceToken(token: string): boolean {
    try {
        const [data, sig] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', ICE_SECRET).update(data).digest('hex');
        if (sig !== expectedSig) return false;
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        return payload.exp > Date.now();
    } catch { return false; }
}

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('ice_token')?.value;
    if (!token || !verifyIceToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
