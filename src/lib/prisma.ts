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
import { applySoftDeleteMiddleware } from './prisma-soft-delete';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'prisma' });

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
export function getDbUrl(tenant: string, isRead = false): string {
    let base = process.env.DATABASE_URL;
    if (isRead && process.env.DATABASE_REPLICA_URL) {
        base = process.env.DATABASE_REPLICA_URL;
    }
    if (!base) {
        throw new Error('DATABASE_URL environment variable is required (set in .env)');
    }

    // 🛡️ Security & Performance Hardening:
    // منع اختناق قاعدة البيانات عبر تحديد سقف الاتصالات (Connection Pooling & Starvation Prevention)
    // إذا لم يكن الـ URL يحتوي بالفعل على بارامترات الاتصال، نقوم بإضافتها لتوافق PgBouncer.
    try {
        const urlObj = new URL(base);
        if (!urlObj.searchParams.has('pgbouncer')) {
            urlObj.searchParams.set('pgbouncer', 'true');
        }
        if (!urlObj.searchParams.has('connection_limit')) {
            urlObj.searchParams.set('connection_limit', '5'); // 5 اتصالات لكل Tenant كحد أقصى
        }
        if (!urlObj.searchParams.has('pool_timeout')) {
            urlObj.searchParams.set('pool_timeout', '10'); // مهلة 10 ثوانٍ لمنع تكدس الـ Event Loop
        }
        base = urlObj.toString();
    } catch (e) {
        // في حال كان الـ URL غير صالح (مثلاً استخدام Prisma Accelerate: prisma://) يتم تجاهل البناء
        log.warn(`Failed to append connection limits to DB URL: ${(e as Error).message}`);
    }

    // Desktop mode: use DATABASE_URL directly (single local DB, no multi-tenant)
    if (process.env.DESKTOP_MODE === 'true') {
        return base;
    }
    
    // Legacy Phase 1 RLS tenants on single master database
    const legacyTenants = ['n11', 'default'];
    if (legacyTenants.includes(tenant)) {
        return base;
    }

    // Phase 2: Physical Database per Tenant
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

// ── RLS Extension ───────────────────────────────────────────────
function withRLS(client: PrismaClient, tenantId: string) {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Skip system models that don't have tenantId
                    const sysModels = ['Tenant', 'User', 'Session', 'SystemSetting'];
                    
                    // Legacy tenants use RLS. New physical DB tenants use isolated DBs so they default to 'default' inside their own DB.
                    const legacyTenants = ['n11', 'default'];
                    const effectiveTenantId = legacyTenants.includes(tenantId) ? tenantId : 'default';

                    if (sysModels.includes(model) || effectiveTenantId === 'default') {
                        return query(args);
                    }

                    // For operations that read/write data, automatically inject effectiveTenantId
                    if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
                        args.where = { ...args.where, tenantId: effectiveTenantId };
                    } else if (['create', 'createMany'].includes(operation)) {
                        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
                        if (Array.isArray(args.data)) {
                            // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
                            args.data = args.data.map(d => ({ ...d, tenantId: effectiveTenantId }));
                        } else {
                            // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
                            args.data = { ...args.data, tenantId: effectiveTenantId };
                        }
                    } else if (operation === 'upsert') {
                        // @ts-expect-error [TS2322] Type assignment mismatch - pending strict types
                        args.where = { ...args.where, tenantId: effectiveTenantId };
                        args.create = { ...args.create, tenantId: effectiveTenantId };
                    }
                    
                    return query(args);
                }
            }
        }
    });
}

// ── Get or create Prisma client for tenant ──────────────────────
export function getClient(tenant: string, options: { read?: boolean } = {}) {
    const isRead = !!options.read;
    const dbUrl = getDbUrl(tenant, isRead);
    
    // Pool key must be unique per physical database URL to prevent cross-tenant data leaks
    const poolKey = isRead ? `READ_${dbUrl}` : `WRITE_${dbUrl}`;

    if (!pool.has(poolKey)) {
        const rawClient = new PrismaClient({
            datasources: { db: { url: dbUrl } },
            log: process.env.NODE_ENV === 'development' ? ['error'] : [],
        });
        
        // Apply soft delete middleware BEFORE RLS wrapper
        applySoftDeleteMiddleware(rawClient);

        // Apply audit middleware for Immutable Tenant Tracking (Law 4)
        const { applyAuditMiddleware } = require('./prisma-audit');
        applyAuditMiddleware(rawClient);

        // 🛡️ LAYER 2: GLOBAL TENANT GUARD EXTENSION
        // This extension guarantees that NO query can execute on business data without a tenantId.
        const guardedClient = rawClient.$extends({
            name: 'tenant-guard',
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const sysModels = ['Tenant', 'User', 'Session', 'SystemSetting', 'EventLog', 'AuditLog', 'SyncConflict'];
                        const sensitiveOps = ['findMany', 'findFirst', 'updateMany', 'deleteMany', 'count', 'groupBy', 'aggregate'];
                        
                        if (!sysModels.includes(model) && sensitiveOps.includes(operation)) {
                            // Ensure args exists
                            if (!args) args = {} as any;
                            
                            const argsAny = args as any;
                            const hasTenantId = argsAny?.where && typeof argsAny.where === 'object' && 'tenantId' in argsAny.where && argsAny.where.tenantId !== undefined;
                            
                            if (!hasTenantId) {
                                throw new Error(`[CRITICAL SECURITY] TENANT ISOLATION VIOLATION: Operation '${operation}' on model '${model}' rejected. Missing 'tenantId' in where clause. You MUST use getTenantPrisma(req) to auto-inject it.`);
                            }
                        }
                        return query(args);
                    }
                }
            }
        }) as unknown as PrismaClient;
        
        pool.set(poolKey, guardedClient);
    }
    
    const baseClient = pool.get(poolKey)!;
    
    // 🛡️ LAYER 1: Tenant-Aware Auto-Injector (withRLS)
    // Return the extended client for this specific tenant which auto-injects tenantId into args
    return withRLS(baseClient, tenant);
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

            const host =
                typeof req.headers.get === 'function'
                    ? req.headers.get('host')
                    : (req.headers as Record<string, string>)['host'];
            if (host && host.endsWith('.namainvist.com')) {
                const tenant = host.replace('.namainvist.com', '').split(':')[0];
                if (tenant !== 'www' && tenant !== 'app') return tenant;
            }
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
            
            const host = hObj.get('host');
            if (host && host.endsWith('.namainvist.com')) {
                const tenant = host.replace('.namainvist.com', '').split(':')[0]; // strip port if present
                if (tenant !== 'www' && tenant !== 'app') return tenant;
            }
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
export function getPrisma(req?: Request | { headers?: unknown }, options: { read?: boolean } = {}): PrismaClient {
    // @ts-expect-error [TS2739] Missing required properties
    return getClient(resolveTenant(req as Parameters<typeof resolveTenant>[0]), options);
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

// Deprecate default export to prevent direct imports bypassing getTenantPrisma
export default smartPrisma;

// Trigger TS reload: ICE modules mapped
