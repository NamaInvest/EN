import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const headersList = await headers();
        const tenant = headersList.get('x-tenant');

        if (!tenant) return NextResponse.json({ isTrialActive: false });

        // نجلب بيانات الاشتراك من n11_db
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.MASTER_DB_URL ||
                'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
        });

        let row: any = null;
        try {
            const result = await pool.query(
                `SELECT subscription_status, plan, trial_ends_at, invoice_quota, product_quota, created_at
                 FROM tenant_accounts WHERE subdomain = $1 LIMIT 1`,
                [tenant]
            );
            row = result.rows[0] || null;
        } finally {
            await pool.end();
        }

        if (!row) return NextResponse.json({ isTrialActive: false });

        const now = new Date();
        const trialEnd = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
        const isTrial = row.subscription_status === 'trial';
        const isExpired = isTrial && trialEnd ? now > trialEnd : false;

        const msRemaining = trialEnd ? trialEnd.getTime() - now.getTime() : 0;
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

        // حساب عدد الفواتير الحالية
        let invoicesUsed = 0;
        try {
            const { getPrisma } = require('@/lib/prisma');
            // نستخدم اتصال مباشر بـ tenant DB
            const { Pool: TenantPool } = require('pg');
            const tenantPool = new TenantPool({
                connectionString: `postgresql://n11_db:n11_pass123@localhost:5432/${tenant}_db`,
            });
            try {
                const countRes = await tenantPool.query('SELECT COUNT(*) as cnt FROM sales_invoices');
                invoicesUsed = parseInt(countRes.rows[0]?.cnt || '0');
            } finally {
                await tenantPool.end();
            }
        } catch { /* تجاهل أخطاء العد */ }

        return NextResponse.json({
            isTrialActive: isTrial,
            isExpired,
            daysRemaining,
            plan: row.plan,
            subscriptionStatus: row.subscription_status,
            invoiceQuota: row.invoice_quota || 30,
            invoicesUsed,
            invoicesRemaining: Math.max(0, (row.invoice_quota || 30) - invoicesUsed),
            productQuota: row.product_quota || 1000,
            trialEndsAt: trialEnd?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('[trial-status]', error);
        return NextResponse.json({ isTrialActive: false });
    }
}
