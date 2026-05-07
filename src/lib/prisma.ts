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
// Use global object to prevent memory leaks during Next.js hot reloads
const globalForPrisma = globalThis as unknown as {
    prismaPool?: Map<string, PrismaClient>;
};
const pool = globalForPrisma.prismaPool || new Map<string, PrismaClient>();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaPool = pool;

// ── DB URL builder ──────────────────────────────────────────────
export function getDbUrl(tenant: string): string {
    const base = process.env.DATABASE_URL;
    if (!base) {
        throw new Error('DATABASE_URL environment variable is required (set in .env)');
    }
    // Desktop mode: use DATABASE_URL directly (single local DB, no multi-tenant)
    if (process.env.DESKTOP_MODE === 'true') {
        return base;
    }
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

// ── Global request store (set by middleware wrapper) ─────────────
// يُخزَّن هنا الـ tenant الحالي من كل request عبر patch في middleware
export const currentRequestStore = new AsyncLocalStorage<string>();

// ── Resolve active tenant ───────────────────────────────────────
/**
 * الأولوية:
 * 1. AsyncLocalStorage من withTenant()
 * 2. AsyncLocalStorage من middleware wrapper
 * 3. x-tenant header من الـ req المُمرَّر
 * 4. TENANT / DEFAULT_TENANT env var
 * 5. 'n11' fallback
 */
export function resolveTenant(req?: {
    headers?: { get?: (k: string) => string | null; [k: string]: unknown };
}): string {
    // Desktop mode: single database, no tenant resolution needed
    if (process.env.DESKTOP_MODE === 'true') return 'local';

    // 1. من الـ context الصريح (withTenant)
    const ctx = tenantContext.getStore();
    if (ctx) return ctx;

    // 2. من الـ middleware request store
    const reqCtx = currentRequestStore.getStore();
    if (reqCtx) return reqCtx;

    // 3. من header المُمرَّر صراحةً (getPrisma(req))
    try {
        if (req?.headers) {
            const h =
                typeof req.headers.get === 'function'
                    ? req.headers.get('x-tenant')
                    : (req.headers as Record<string, string>)['x-tenant'];
            if (h) return h;
        }
    } catch { /* ignore */ }

    // 4. محاولة قراءة next/headers (Next.js 14 sync headers)
    try {
        // @ts-ignore
        const { headers } = require('next/headers');
        const hObj = headers();
        // في Next.js 15: headers() تُرجع Promise — نتجاهلها
        if (hObj && typeof hObj.get === 'function') {
            const h = hObj.get('x-tenant');
            if (h && typeof h === 'string') return h;
        }
    } catch { /* ignore */ }

    // 5. من البيئة (PM2 per-process mode)
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

// ── Helper: sync read of x-tenant from Next.js internal context ──
function getTenantFromNextContext(): string | null {
    try {
        // Next.js 16 stores request context in a global
        const workUnitStore = (globalThis as any).__NEXT_REQUEST_CONTEXT__?.get?.();
        if (workUnitStore?.headers) {
            const h = workUnitStore.headers.get?.('x-tenant') || workUnitStore.headers['x-tenant'];
            if (h && typeof h === 'string') return h;
        }
    } catch { /* ignore */ }
    return null;
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
        // أولوية: tenantContext → Next.js internal context → env → n11
        let tenant: string | null | undefined = tenantContext.getStore() || currentRequestStore.getStore();
        if (!tenant) tenant = getTenantFromNextContext();
        if (!tenant) tenant = process.env.TENANT || process.env.DEFAULT_TENANT || 'n11';
        const client = getClient(tenant as string);
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
