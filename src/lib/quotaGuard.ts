import { NextResponse } from 'next/server';

// نوع نتيجة فحص الـ Quota
export interface QuotaResult {
    allowed: boolean;
    reason: 'ok' | 'trial_expired' | 'quota_exceeded' | 'db_error';
    resource?: string;
    limit?: number;
    current?: number;
    plan?: string;
    message?: string;
}

/**
 * فحص القيود قبل العمليات الحساسة (فواتير / أصناف)
 * @param tenant اسم الـ subdomain (x-tenant header)
 * @param resource نوع العملية: 'invoice' | 'product'
 */
export async function checkQuota(tenant: string, resource: 'invoice' | 'product'): Promise<QuotaResult> {
    try {
        // جلب بيانات الاشتراك من n11_db
        const { Pool } = require('pg');
        const masterPool = new Pool({
            connectionString: process.env.MASTER_DB_URL ||
                'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
        });

        let row: any = null;
        try {
            const result = await masterPool.query(
                `SELECT subscription_status, plan, trial_ends_at, invoice_quota, product_quota
                 FROM tenant_accounts WHERE subdomain = $1 LIMIT 1`,
                [tenant]
            );
            row = result.rows[0] || null;
        } finally {
            await masterPool.end();
        }

        if (!row) return { allowed: true, reason: 'ok' }; // لا بيانات → اسمح

        const status = row.subscription_status;
        const plan = row.plan || 'free';

        // ── الباقات المدفوعة: لا قيود ──────────────────────────────────
        if (plan === 'basic' || plan === 'pro' || plan === 'enterprise') {
            return { allowed: true, reason: 'ok', plan };
        }

        // ── فحص انتهاء الفترة التجريبية ────────────────────────────────
        if (status === 'trial' && row.trial_ends_at) {
            const now = new Date();
            const trialEnd = new Date(row.trial_ends_at);
            if (now > trialEnd) {
                return {
                    allowed: false,
                    reason: 'trial_expired',
                    plan,
                    message: 'انتهت الفترة التجريبية. قم بالترقية لمتابعة الاستخدام.',
                };
            }
        }

        // ── فحص الحصص (Quotas) ─────────────────────────────────────────
        const tenantPool = new Pool({
            connectionString: `postgresql://n11_db:n11_pass123@localhost:5432/${tenant}_db`,
        });

        let current = 0;
        let limit = 0;

        try {
            if (resource === 'invoice') {
                limit = row.invoice_quota || 30;
                const r = await tenantPool.query(
                    'SELECT COUNT(*) as cnt FROM sales_invoices'
                );
                current = parseInt(r.rows[0]?.cnt || '0');
            } else if (resource === 'product') {
                limit = row.product_quota || 1000;
                const r = await tenantPool.query(
                    'SELECT COUNT(*) as cnt FROM products WHERE active = true'
                );
                current = parseInt(r.rows[0]?.cnt || '0');
            }
        } finally {
            await tenantPool.end();
        }

        if (current >= limit) {
            return {
                allowed: false,
                reason: 'quota_exceeded',
                resource,
                limit,
                current,
                plan,
                message: resource === 'invoice'
                    ? `وصلت للحد الأقصى من الفواتير (${limit}). قم بالترقية لإصدار فواتير غير محدودة.`
                    : `وصلت للحد الأقصى من الأصناف (${limit}). قم بالترقية لإضافة أصناف غير محدودة.`,
            };
        }

        return { allowed: true, reason: 'ok', plan, limit, current };

    } catch (error) {
        console.error('[quotaGuard] Error:', error);
        return { allowed: true, reason: 'ok' }; // عند فشل الفحص → اسمح (لا نريد حجب المستخدمين)
    }
}

/**
 * استجابة موحّدة لخطأ الـ Quota — يُرجع 402 Payment Required
 */
export function quotaErrorResponse(result: QuotaResult): NextResponse {
    return NextResponse.json(
        {
            error: result.reason === 'trial_expired' ? 'trial_expired' : 'quota_exceeded',
            message: result.message || 'تجاوزت الحد المسموح في خطتك الحالية.',
            resource: result.resource,
            limit: result.limit,
            current: result.current,
            plan: result.plan,
            upgradeUrl: 'https://namainvist.com/pricing',
        },
        { status: 402 }
    );
}
