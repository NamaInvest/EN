import { NextRequest } from 'next/server';

/**
 * Asserts that a tenantId is present. Throws an error otherwise.
 */
export function assertTenant(tenantId?: string | null): string {
    if (!tenantId) {
        throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId context in execution flow.');
    }
    return tenantId;
}

/**
 * Validates that a Prisma `where` clause contains a tenantId.
 * Prevents cross-tenant data leakage in findMany, updateMany, deleteMany.
 */
export function requireTenantFilter<T extends { tenantId?: string | object }>(whereClause: T): T {
    if (!whereClause || !('tenantId' in whereClause) || whereClause.tenantId === undefined || whereClause.tenantId === null) {
         throw new Error('TENANT_ISOLATION_VIOLATION: Query missing mandatory tenantId filter.');
    }
    return whereClause;
}

/**
 * Extracts and validates the tenant ID from the incoming request headers.
 */
export function validateTenantAccess(req: Request | NextRequest): string {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
        throw new Error('TENANT_ISOLATION_VIOLATION: Incoming request missing x-tenant-id header.');
    }
    return tenantId;
}
