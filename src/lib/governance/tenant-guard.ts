import { NextRequest } from 'next/server';

/**
 * Asserts that a tenantId is strictly present.
 */
export function assertTenant(tenantId?: string | null): string {
    if (!tenantId || tenantId.trim() === '') {
        throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId context in execution flow.');
    }
    return tenantId;
}

/**
 * Extracts and asserts tenantId from the request headers.
 */
export function requireTenantId(request: NextRequest | Request): string {
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('x-tenant');
    return assertTenant(tenantId);
}

/**
 * Merges the tenantId into a Prisma 'where' clause securely.
 */
export function ensureTenantWhere<T extends Record<string, any>>(whereClause: T | undefined | null, tenantId: string): T & { tenantId: string } {
    const w = whereClause || {} as T;
    return { ...w, tenantId };
}

/**
 * Validates at runtime that a Prisma operation is securely scoped to a tenant.
 */
export function assertTenantScopedOperation(model: string, operation: string, args: any) {
    if (['create', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
        const hasWhereScope = args?.where?.tenantId;
        const hasDataScope = args?.data?.tenantId;
        
        if (!hasWhereScope && !hasDataScope) {
            throw new Error(`TENANT_ISOLATION_VIOLATION: Unscoped write/delete operation on ${model}`);
        }
    }
}
