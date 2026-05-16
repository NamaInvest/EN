import { NextRequest } from 'next/server';

export function assertTenant(tenantId: string | undefined | null): string {
  if (!tenantId || tenantId.trim() === '') {
    throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId');
  }
  return tenantId;
}

export function requireTenantId(req: NextRequest | any): string {
  // Try to extract from standard headers or auth context
  let tenantId = null;
  
  if (req && typeof req.headers?.get === 'function') {
    tenantId = req.headers.get('x-tenant-id');
  } else if (req && req.tenantId) {
    tenantId = req.tenantId;
  }
  
  return assertTenant(tenantId);
}

export function assertTenantScopedOperation(modelName: string, operation: string, args: any, tenantId: string) {
  // Enforces that the arguments passed to a Prisma operation contain the tenantId
  if (!args || typeof args !== 'object') {
     throw new Error(`TENANT_ISOLATION_VIOLATION: Missing arguments for ${modelName}.${operation}`);
  }
  
  // Basic validation that tenantId is in the where clause
  if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
      if (!args.where || args.where.tenantId !== tenantId) {
          throw new Error(`TENANT_ISOLATION_VIOLATION: ${modelName}.${operation} must be scoped to tenant ${tenantId}`);
      }
  }
  return true;
}
