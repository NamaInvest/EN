/**
 * Multi-Tenant Prisma Client (v2 — Safe Build)
 * يستخدم X-Tenant header الذي يضيفه middleware.ts تلقائياً
 * بدون أي استدعاء لـ headers() داخل الـ Proxy (آمن وقت البناء)
 */
import { PrismaClient } from '@prisma/client';

// Connection pool — one client per tenant
const tenantPool = new Map<string, PrismaClient>();

/** Build the DB URL for a given tenant slug */
export function getDbUrl(tenant: string): string {
    const base =
        process.env.DATABASE_URL ||
        'postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public';
    // Replace only the DB name part: /n11_db → /company_db
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

/** Get or create a Prisma client for a tenant */
export function getClient(tenant: string): PrismaClient {
    if (!tenantPool.has(tenant)) {
        tenantPool.set(
            tenant,
            new PrismaClient({
                datasources: { db: { url: getDbUrl(tenant) } },
                log: process.env.NODE_ENV === 'development' ? ['error'] : [],
            })
        );
    }
    return tenantPool.get(tenant)!;
}

/** 
 * Resolve tenant from:
 * 1. x-tenant header (set by middleware)
 * 2. TENANT env var (for single-tenant pm2 mode)
 * 3. DEFAULT_TENANT env var
 * 4. 'n11' hardcoded fallback
 */
export function resolveTenant(req?: { headers?: { get?: (k:string)=>string|null, [k:string]: any } }): string {
    // From request-level header (added by middleware)
    try {
        if (req?.headers) {
            const h = typeof req.headers.get === 'function'
                ? req.headers.get('x-tenant')
                : (req.headers as any)['x-tenant'];
            if (h) return h as string;
        }
    } catch { /* ignore */ }

    // From process environment (per-process tenant override)
    if (process.env.TENANT) return process.env.TENANT;
    if (process.env.DEFAULT_TENANT) return process.env.DEFAULT_TENANT;

    return 'n11';
}

/**
 * Factory function to get tenant-specific prisma client from a request.
 * Use this in API route handlers:
 *   const prisma = getTenantPrisma(request);
 */
export function getTenantPrisma(req?: Request | { headers?: any }): PrismaClient {
    const tenant = resolveTenant(req as any);
    return getClient(tenant);
}

// ────────────────────────────────────────────────────────────────
// Default export: a single prisma client using TENANT env var.
// Works for single-tenant PM2 processes (current deployment model)
// and as a safe fallback.
// ────────────────────────────────────────────────────────────────
const defaultTenant = process.env.TENANT || process.env.DEFAULT_TENANT || 'n11';

// Named export — supports: import { prisma } from '@/lib/prisma'
export const prisma = getClient(defaultTenant);

// Default export  — supports: import prisma from '@/lib/prisma'
export default prisma;

