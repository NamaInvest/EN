import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import crypto from 'crypto';

const ICE_SECRET = process.env.ICE_SECRET;
if (!ICE_SECRET) throw new Error('CRITICAL: ICE_SECRET is not set in environment variables!');

if (!process.env.MASTER_DB_URL) {
    throw new Error('MASTER_DB_URL is required for ICE panel');
}
const masterPool = new Pool({
    connectionString: process.env.MASTER_DB_URL,
    max: 3,
});

const DB_BASE = {
    host: 'localhost', port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || '',
};
if (!DB_BASE.password) {
    throw new Error('POSTGRES_ROOT_PASSWORD is required for ICE panel');
}

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

async function verifyIceAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('ice_token')?.value;
    return !!token && verifyIceToken(token);
}

// POST: toggle module
export async function POST(req: Request) {
    if (!await verifyIceAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain, moduleName, enabled } = await req.json();
    if (!subdomain || !moduleName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { Client } = require('pg');
    const client = new Client({ ...DB_BASE, database: `${subdomain}_db` });
    try {
        await client.connect();
        // Ensure Setting table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Setting" (
                key TEXT PRIMARY KEY,
                value TEXT DEFAULT ''
            )
        `);
        const { rows } = await client.query(`SELECT value FROM "Setting" WHERE key = 'hidden_modules'`);
        let hidden: string[] = [];
        try { hidden = JSON.parse(rows[0]?.value || '[]'); } catch {}

        if (enabled) hidden = hidden.filter((m: string) => m !== moduleName);
        else if (!hidden.includes(moduleName)) hidden.push(moduleName);

        await client.query(`
            INSERT INTO "Setting" (key, value) VALUES ('hidden_modules', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(hidden)]);

        // ----------------------------------------------------
        // Sync with Master DB (TenantFeatureFlag)
        // ----------------------------------------------------
        try {
            const tenantRes = await masterPool.query(`SELECT id FROM tenant_accounts WHERE subdomain = $1`, [subdomain]);
            if (tenantRes.rows.length > 0) {
                const tenantId = tenantRes.rows[0].id;
                
                // First ensure table exists (it should via Prisma, but just in case for raw SQL)
                await masterPool.query(`
                    CREATE TABLE IF NOT EXISTS tenant_feature_flags (
                        id SERIAL PRIMARY KEY,
                        module_name VARCHAR(255) NOT NULL,
                        is_enabled BOOLEAN DEFAULT true,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        tenant_account_id INTEGER,
                        desktop_license_id INTEGER,
                        CONSTRAINT unique_tenant_module UNIQUE (tenant_account_id, module_name)
                    )
                `);

                await masterPool.query(`
                    INSERT INTO tenant_feature_flags (tenant_account_id, module_name, is_enabled, updated_at)
                    VALUES ($1, $2, $3, NOW())
                    ON CONFLICT (tenant_account_id, module_name)
                    DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = NOW()
                `, [tenantId, moduleName, enabled]);
            }
        } catch (masterErr: any) {
            console.error('[ICE Toggle] Master DB Sync Error:', masterErr.message);
        }

        return NextResponse.json({ success: true, hiddenModules: hidden });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    } finally { await client.end().catch(() => {}); }
}

// PATCH: subscription management (extend trial, change plan, update quota)
export async function PATCH(req: Request) {
    if (!await verifyIceAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { subdomain, action, days, plan, invoiceQuota, productQuota } = body;

    if (!subdomain) return NextResponse.json({ error: 'subdomain required' }, { status: 400 });

    try {
        if (action === 'extend') {
            // مد التجربة بعدد أيام محدد
            const addDays = days || 30;
            await masterPool.query(`
                UPDATE tenant_accounts
                SET trial_ends_at = GREATEST(trial_ends_at, NOW()) + INTERVAL '${addDays} days',
                    subscription_status = 'trial'
                WHERE subdomain = $1
            `, [subdomain]);

        } else if (action === 'activate_paid') {
            // تفعيل اشتراك مدفوع
            await masterPool.query(`
                UPDATE tenant_accounts
                SET subscription_status = 'active',
                    plan = $2,
                    invoice_quota = 999999,
                    product_quota = 999999,
                    trial_ends_at = NULL
                WHERE subdomain = $1
            `, [subdomain, plan || 'basic']);

        } else if (action === 'set_plan') {
            // تغيير الخطة فقط
            await masterPool.query(`
                UPDATE tenant_accounts SET plan = $2 WHERE subdomain = $1
            `, [subdomain, plan]);

        } else if (action === 'set_quota') {
            // تعديل الحدود
            const updates: string[] = [];
            const vals: any[] = [subdomain];
            if (invoiceQuota !== undefined) { vals.push(invoiceQuota); updates.push(`invoice_quota = $${vals.length}`); }
            if (productQuota !== undefined) { vals.push(productQuota); updates.push(`product_quota = $${vals.length}`); }
            if (body.userQuota !== undefined) { vals.push(body.userQuota); updates.push(`user_quota = $${vals.length}`); }
            if (updates.length > 0) {
                await masterPool.query(
                    `UPDATE tenant_accounts SET ${updates.join(', ')} WHERE subdomain = $1`,
                    vals
                );
            }

        } else if (action === 'suspend') {
            await masterPool.query(`
                UPDATE tenant_accounts SET subscription_status = 'suspended' WHERE subdomain = $1
            `, [subdomain]);

        } else if (action === 'update_info') {
            // تحديث بيانات المستأجر (بريد، اسم، ضريبي)
            const updates: string[] = [];
            const vals: any[] = [subdomain];
            if (body.email) { vals.push(body.email); updates.push(`user_email = $${vals.length}`); }
            if (body.orgName) { vals.push(body.orgName); updates.push(`org_name = $${vals.length}`); }
            if (body.vatNumber) { vals.push(body.vatNumber); updates.push(`vat_number = $${vals.length}`); }
            if (updates.length > 0) {
                await masterPool.query(
                    `UPDATE tenant_accounts SET ${updates.join(', ')} WHERE subdomain = $1`,
                    vals
                );
                // أيضاً حدّث اسم الشركة في قاعدة بيانات الـ tenant
                if (body.orgName) {
                    const { Client: PgClient } = require('pg');
                    const tc = new PgClient({ ...DB_BASE, database: `${subdomain}_db` });
                    try {
                        await tc.connect();
                        await tc.query(`
                            INSERT INTO "Setting" (key, value) VALUES ('companyNameAr', $1)
                            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                        `, [body.orgName]);
                    } catch {} finally { await tc.end().catch(() => {}); }
                }
            }

        } else if (action === 'apply_plan') {
            // تطبيق باقة مع تحديث الحدود والوحدات تلقائياً
            const { plan: newPlan, invoiceQuota: iq, productQuota: pq, userQuota: uq, allowedModules } = body;
            const subStatus = newPlan === 'free' ? 'trial' : 'active';
            await masterPool.query(`
                UPDATE tenant_accounts
                SET plan = $2, invoice_quota = $3, product_quota = $4, user_quota = $5,
                    subscription_status = $6
                WHERE subdomain = $1
            `, [subdomain, newPlan, iq || 999999, pq || 999999, uq || 999999, subStatus]);

            // تحديث الوحدات المخفية في قاعدة بيانات الـ tenant
            if (allowedModules && Array.isArray(allowedModules)) {
                const ALL_MODULES = ['Sales','POS','Purchases','Inventory','Finance','HR','Manufacturing','CRM','Enterprise','AI','Reports','Settings'];
                const hiddenModules = ALL_MODULES.filter(m => !allowedModules.includes(m));
                const { Client: PgClient } = require('pg');
                const tc = new PgClient({ ...DB_BASE, database: `${subdomain}_db` });
                try {
                    await tc.connect();
                    await tc.query(`CREATE TABLE IF NOT EXISTS "Setting" (key TEXT PRIMARY KEY, value TEXT DEFAULT '')`);
                    await tc.query(`
                        INSERT INTO "Setting" (key, value) VALUES ('hidden_modules', $1)
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                    `, [JSON.stringify(hiddenModules)]);
                } catch {} finally { await tc.end().catch(() => {}); }

                // Sync with Master DB
                try {
                    const tenantRes = await masterPool.query(`SELECT id FROM tenant_accounts WHERE subdomain = $1`, [subdomain]);
                    if (tenantRes.rows.length > 0) {
                        const tenantId = tenantRes.rows[0].id;
                        await masterPool.query(`
                            CREATE TABLE IF NOT EXISTS tenant_feature_flags (
                                id SERIAL PRIMARY KEY,
                                module_name VARCHAR(255) NOT NULL,
                                is_enabled BOOLEAN DEFAULT true,
                                created_at TIMESTAMPTZ DEFAULT NOW(),
                                updated_at TIMESTAMPTZ DEFAULT NOW(),
                                tenant_account_id INTEGER,
                                desktop_license_id INTEGER,
                                CONSTRAINT unique_tenant_module UNIQUE (tenant_account_id, module_name)
                            )
                        `);

                        for (const module of ALL_MODULES) {
                            const isEnabled = allowedModules.includes(module);
                            await masterPool.query(`
                                INSERT INTO tenant_feature_flags (tenant_account_id, module_name, is_enabled, updated_at)
                                VALUES ($1, $2, $3, NOW())
                                ON CONFLICT (tenant_account_id, module_name)
                                DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = NOW()
                            `, [tenantId, module, isEnabled]);
                        }
                    }
                } catch (masterErr: any) {
                    console.error('[ICE Apply Plan] Master DB Sync Error:', masterErr.message);
                }
            }

        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, action });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// DELETE: حذف مستأجر بالكامل (قاعدة البيانات + حساب Clerk + السجل)
export async function DELETE(req: Request) {
    if (!await verifyIceAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain } = await req.json();
    if (!subdomain) return NextResponse.json({ error: 'subdomain required' }, { status: 400 });

    // حماية الأنظمة الأساسية
    if (['n7', 'n11'].includes(subdomain)) {
        return NextResponse.json({ error: 'محمي - لا يمكن حذف هذا الحساب' }, { status: 403 });
    }

    try {
        // 1. جلب بيانات المستأجر (clerk_user_id, email)
        const { rows } = await masterPool.query(
            `SELECT clerk_user_id, user_email FROM tenant_accounts WHERE subdomain = $1`,
            [subdomain]
        );
        const tenant = rows[0];

        // 2. حذف قاعدة بيانات الـ tenant باستخدام superuser
        const dbName = `${subdomain}_db`;
        const superPool = new Pool({
            host: DB_BASE.host, port: DB_BASE.port,
            user: DB_BASE.user, password: DB_BASE.password,
            database: 'postgres', max: 2,
        });
        try {
            // قطع أي اتصالات نشطة
            await superPool.query(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '${dbName}'
                AND pid <> pg_backend_pid()
            `);
            await superPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
            console.log(`[ICE DELETE] Dropped database: ${dbName}`);
        } catch (dbErr: any) {
            console.error(`[ICE DELETE] DB drop error: ${dbErr.message}`);
        } finally {
            await superPool.end().catch(() => {});
        }

        // 3. حذف حساب Clerk المرتبط
        if (tenant?.clerk_user_id) {
            try {
                const clerkRes = await fetch(`https://api.clerk.com/v1/users/${tenant.clerk_user_id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
                });
                console.log(`[ICE DELETE] Clerk user ${tenant.clerk_user_id} deleted: ${clerkRes.status}`);
            } catch (clerkErr: any) {
                console.error(`[ICE DELETE] Clerk delete error: ${clerkErr.message}`);
            }
        }

        // 4. حذف سجل المستأجر من الجدول
        await masterPool.query(`DELETE FROM tenant_accounts WHERE subdomain = $1`, [subdomain]);
        console.log(`[ICE DELETE] Tenant record deleted: ${subdomain}`);

        return NextResponse.json({ success: true, action: 'delete', subdomain });
    } catch (err: any) {
        console.error(`[ICE DELETE] Error:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
