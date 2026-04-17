/**
 * Multi-Tenant Prisma Client
 * يقرأ الـ subdomain تلقائياً من Host header لكل طلب
 * وفتح قاعدة البيانات الصحيحة بدون أي تغيير في باقي الملفات
 */
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

// Pool of database connections (one per tenant)
const tenantPool = new Map<string, PrismaClient>();

// Build DB URL for a specific tenant
function getDbUrl(tenant: string): string {
    const base =
        process.env.DATABASE_URL ||
        'postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public';
    // Replace the DB name: n11_db → company_db
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

// Get or create Prisma client for a tenant
function getClient(tenant: string): PrismaClient {
    if (!tenantPool.has(tenant)) {
        tenantPool.set(
            tenant,
            new PrismaClient({
                datasources: { db: { url: getDbUrl(tenant) } },
            })
        );
    }
    return tenantPool.get(tenant)!;
}

// Extract tenant name from Host header
function getCurrentTenant(): string {
    try {
        const host = headers().get('host') || '';
        // n11.namainvist.com  → "n11"
        // company.namainvist.com → "company"
        // localhost:3000 → fallback
        const sub = host.split('.')[0];
        return sub && !sub.includes('localhost') ? sub : (process.env.DEFAULT_TENANT || 'n11');
    } catch {
        // Outside request context (build time, seed scripts, etc.)
        return process.env.DEFAULT_TENANT || 'n11';
    }
}

/**
 * Proxy prisma client — automatically routes to the correct tenant DB
 * All existing: import prisma from '@/lib/prisma' — WORK WITHOUT CHANGES ✅
 */
const prisma = new Proxy({} as PrismaClient, {
    get(_, prop: string | symbol) {
        const tenant = getCurrentTenant();
        const client = getClient(tenant);
        const val = (client as any)[prop];
        // Bind functions to their client so `this` context is correct
        return typeof val === 'function' ? val.bind(client) : val;
    },
});

export { tenantPool, getClient, getCurrentTenant };
export default prisma;
