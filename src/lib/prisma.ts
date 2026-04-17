/**
 * Multi-Tenant Prisma Client — True Multi-Tenant Edition
 * ════════════════════════════════════════════════════════
 *
 * كيف يعمل:
 *   1. middleware.ts يقرأ الـ subdomain من الـ Host header
 *   2. يحقن x-tenant header في كل request (مثلاً: "n11", "ice", "company123")
 *   3. الـ API routes تستخدم `import prisma from '@/lib/prisma'` كما هو
 *   4. لكن الـ default export أصبح Proxy يقرأ AsyncLocalStorage لمعرفة الـ tenant
 *   5. كل tenant يحصل على Prisma client مستقل متصل بـ DB الخاص به
 *
 * Database convention:
 *   tenant "n11"       → postgresql://...@localhost:5432/n11_db
 *   tenant "company1"  → postgresql://...@localhost:5432/company1_db
 *   tenant "ice"       → postgresql://...@localhost:5432/ice_db
 */

import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// ── Tenant context store ─────────────────────────────────────────
// يخزّن اسم الـ tenant الحالي عبر Stack الطلب
export const tenantContext = new AsyncLocalStorage<string>();

// ── Connection pool ─────────────────────────────────────────────
// Client واحد لكل tenant — لا نُعيد الإنشاء في كل طلب
const pool = new Map<string, PrismaClient>();

// ── DB URL builder ──────────────────────────────────────────────
export function getDbUrl(tenant: string): string {
    const base =
        process.env.DATABASE_URL ||
        'postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public';
    // يبدّل اسم الـ DB فقط: /n11_db → /company_db
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

// ── Get or create Prisma client for tenant ──────────────────────
export function getClient(tenant: string): PrismaClient {
    if (!pool.has(tenant)) {
        pool.set(
            tenant,
            new PrismaClient({
                datasources: { db: { url: getDbUrl(tenant) } },
                log: process.env.NODE_ENV === 'development' ? ['error'] : [],
            })
        );
    }
    return pool.get(tenant)!;
}

// ── Resolve active tenant ───────────────────────────────────────
/**
 * الأولوية:
 * 1. AsyncLocalStorage (يُعيَّن بواسطة withTenant() في كل API handler)
 * 2. TENANT env var (لـ PM2 single-tenant، أي n11 / ice / n7)
 * 3. DEFAULT_TENANT env var
 * 4. 'n11' كـ fallback آمن
 */
export function resolveTenant(req?: {
    headers?: { get?: (k: string) => string | null; [k: string]: unknown };
}): string {
    // 1. من الـ context (الأسرع والأدق)
    const ctx = tenantContext.getStore();
    if (ctx) return ctx;

    // 2. من header (يضعه middleware.ts)
    try {
        if (req?.headers) {
            const h =
                typeof req.headers.get === 'function'
                    ? req.headers.get('x-tenant')
                    : (req.headers as Record<string, string>)['x-tenant'];
            if (h) return h;
        } else {
            // App Router global context override
            const { headers } = require('next/headers');
            const h = headers().get('x-tenant');
            if (h) return h;
        }
    } catch { /* ignore */ }

    // 3. من البيئة (PM2 per-process mode)
    if (process.env.TENANT) return process.env.TENANT;
    if (process.env.DEFAULT_TENANT) return process.env.DEFAULT_TENANT;

    return 'n11';
}

// ── Main helper for API routes ──────────────────────────────────
/**
 * استخدم هذه الدالة في أي API route يحتاج Prisma ديناميكي:
 *
 *   export async function GET(req: NextRequest) {
 *     const prisma = getPrisma(req);
 *     const items = await prisma.product.findMany();
 *   }
 */
export function getPrisma(req?: Request | { headers?: unknown }): PrismaClient {
    return getClient(resolveTenant(req as Parameters<typeof resolveTenant>[0]));
}

// Alias للتوافق مع الكود القديم
export const getTenantPrisma = getPrisma;

// ── withTenant: run a callback in a tenant context ──────────────
/**
 * يُغلّف الكود بـ AsyncLocalStorage context لضمان صحة الـ tenant
 * مفيد جداً في الـ background jobs والـ cron tasks
 *
 * مثال:
 *   await withTenant('company123', async () => {
 *     await prisma.salesInvoice.findMany(); // → company123_db تلقائياً
 *   });
 */
export async function withTenant<T>(
    tenant: string,
    fn: () => Promise<T>
): Promise<T> {
    return tenantContext.run(tenant, fn);
}

// ── Default export: Smart Proxy ─────────────────────────────────
/**
 * الـ Proxy يعترض كل استدعاء على `prisma` ويوجّهه للـ tenant الصحيح.
 * هذا يعني أن `import prisma from '@/lib/prisma'` يعمل لكل الـ API routes
 * بدون تعديل — فقط يحتاج x-tenant header أو TENANT env var.
 *
 * ملاحظة: يعمل في Node.js runtime فقط (مش edge).
 */
const smartPrisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const tenant = resolveTenant();
        const client = getClient(tenant);
        const value = (client as unknown as Record<string | symbol, unknown>)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});

// ── Exports ─────────────────────────────────────────────────────
// Named export (for: import { prisma } from '@/lib/prisma')
export { smartPrisma as prisma };

// Default export (for: import prisma from '@/lib/prisma')
export default smartPrisma;
