import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Pool } from 'pg';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const masterPool = new Pool({
    connectionString: process.env.MASTER_DB_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
    max: 3,
});

const DB_BASE = {
    host: 'localhost', port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || 'RootPassNama123',
};

async function verifyOwner(userId: string): Promise<boolean> {
    try {
        const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
        const u = await res.json();
        return (u?.email_addresses?.[0]?.email_address || '') === OWNER_EMAIL;
    } catch { return false; }
}

// POST: toggle module
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyOwner(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { subdomain, moduleName, enabled } = await req.json();
    if (!subdomain || !moduleName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const pool = new Pool({ ...DB_BASE, database: `${subdomain}_db` });
    try {
        await pool.connect();
        const { rows } = await pool.query(`SELECT value FROM "Setting" WHERE key = 'hidden_modules'`);
        let hidden: string[] = [];
        try { hidden = JSON.parse(rows[0]?.value || '[]'); } catch {}

        if (enabled) hidden = hidden.filter(m => m !== moduleName);
        else if (!hidden.includes(moduleName)) hidden.push(moduleName);

        await pool.query(`
            INSERT INTO "Setting" (key, value) VALUES ('hidden_modules', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(hidden)]);

        return NextResponse.json({ success: true, hiddenModules: hidden });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    } finally { await pool.end().catch(() => {}); }
}

// PATCH: subscription management (extend trial, change plan, update quota)
export async function PATCH(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!await verifyOwner(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, action });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
