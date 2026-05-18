import { NextRequest } from 'next/server';

export const TENANT_ISOLATION_ERROR = 'TENANT_ISOLATION_VIOLATION';

export type TenantMode = 'legacy-rls' | 'physical-db' | 'desktop-local' | 'system';

export interface TenantContextInfo {
  /**
   * Routing tenant from the request boundary: subdomain, x-tenant, JWT, API key,
   * desktop license, or an explicit background-job context.
   */
  tenantSlug: string;
  /**
   * Row-level tenant value used inside tenant databases. Phase 2 physical
   * tenant databases store business rows with `tenantId = "default"` while
   * legacy shared tenants still store the real tenant slug in each row.
   */
  recordTenantId: string;
  mode: TenantMode;
  source: string;
  headerTenant?: string | null;
  authTenantId?: string | null;
  subdomainTenant?: string | null;
}

export interface TenantMatchInput {
  routeTenant: TenantContextInfo;
  authTenantId?: string | null;
  headerTenantId?: string | null;
  headerTenant?: string | null;
  pathname?: string;
}

const LEGACY_TENANTS = new Set(['n11', 'default']);
const SYSTEM_TENANTS = new Set(['ice', 'master', 'system']);

export function normalizeTenantId(value?: string | number | null): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function assertTenant(tenantId?: string | number | null): string {
  const normalized = normalizeTenantId(tenantId);
  if (!normalized) {
    throw new Error(`${TENANT_ISOLATION_ERROR}: Missing tenantId context in execution flow.`);
  }
  return normalized;
}

export function isLegacyTenant(tenantSlug: string): boolean {
  return LEGACY_TENANTS.has(assertTenant(tenantSlug));
}

export function isSystemTenant(tenantSlug: string): boolean {
  return SYSTEM_TENANTS.has(assertTenant(tenantSlug));
}

export function getRecordTenantId(tenantSlug: string, desktopMode = process.env.DESKTOP_MODE === 'true'): string {
  const normalized = assertTenant(tenantSlug);
  if (desktopMode) return 'default';
  if (isLegacyTenant(normalized)) return normalized;
  return 'default';
}

export function getTenantMode(tenantSlug: string, desktopMode = process.env.DESKTOP_MODE === 'true'): TenantMode {
  const normalized = assertTenant(tenantSlug);
  if (desktopMode || normalized === 'local') return 'desktop-local';
  if (isSystemTenant(normalized)) return 'system';
  if (isLegacyTenant(normalized)) return 'legacy-rls';
  return 'physical-db';
}

export function buildTenantContext(tenantSlug: string, source: string, extras: Partial<TenantContextInfo> = {}): TenantContextInfo {
  const normalized = assertTenant(tenantSlug);
  return {
    tenantSlug: normalized,
    recordTenantId: getRecordTenantId(normalized),
    mode: getTenantMode(normalized),
    source,
    ...extras,
  };
}

function getRequestHeader(req: NextRequest | Request | { headers?: unknown }, name: string): string | null {
  const headers = req.headers as Headers | Record<string, string | string[] | undefined> | undefined;
  if (!headers) return null;
  if (typeof (headers as Headers).get === 'function') {
    return normalizeTenantId((headers as Headers).get(name));
  }
  const direct = (headers as Record<string, string | string[] | undefined>)[name];
  const lower = (headers as Record<string, string | string[] | undefined>)[name.toLowerCase()];
  const candidate = direct ?? lower;
  const value = Array.isArray(candidate) ? candidate[0] : candidate;
  return normalizeTenantId(value as string | undefined);
}

export function requireTenantId(request: NextRequest | Request | { headers?: unknown; tenantId?: string | null }): string {
  const explicitTenant = normalizeTenantId((request as { tenantId?: string | null }).tenantId);
  const tenantId =
    explicitTenant ||
    getRequestHeader(request, 'x-tenant-id') ||
    getRequestHeader(request, 'x-tenant') ||
    getRequestHeader(request, 'x-tenant-subdomain');

  return assertTenant(tenantId);
}

export type TenantWhere<T extends Record<string, unknown>> = T & { tenantId: string };

export function ensureTenantWhere<T extends Record<string, unknown>>(
  whereClause: T | undefined | null,
  tenantId: string
): TenantWhere<T> {
  return { ...(whereClause ?? ({} as T)), tenantId: assertTenant(tenantId) };
}

export function requireTenantFilter<T extends { tenantId?: unknown }>(whereClause: T | undefined | null): T {
  if (!whereClause || whereClause.tenantId === undefined || whereClause.tenantId === null) {
    throw new Error(`${TENANT_ISOLATION_ERROR}: Query missing mandatory tenantId filter.`);
  }
  return whereClause;
}

export function validateTenantAccess(req: Request | NextRequest): string {
  return requireTenantId(req);
}

export function getAllowedTenantValues(context: TenantContextInfo): Set<string> {
  return new Set([
    context.tenantSlug,
    context.recordTenantId,
    `${context.tenantSlug}_db`,
    `${context.recordTenantId}_db`,
  ]);
}

export function requireTenantContext(req: NextRequest | Request | { headers?: unknown; tenantId?: string | null }): TenantContextInfo {
  const tenantId = requireTenantId(req);
  return buildTenantContext(tenantId, 'requireTenantContext');
}

export function assertTenantAccess(req: Request | NextRequest, requiredTenantId?: string): TenantContextInfo {
  const context = requireTenantContext(req);
  if (requiredTenantId && context.tenantSlug !== requiredTenantId) {
    throw new Error(`${TENANT_ISOLATION_ERROR}: Cross-tenant access denied. Request tenant '${context.tenantSlug}' does not match required tenant '${requiredTenantId}'.`);
  }
  return context;
}

function getAllowedBoundaryTenantValues(context: TenantContextInfo): Set<string> {
  return new Set([context.tenantSlug, `${context.tenantSlug}_db`]);
}

function assertAllowedTenantValue(value: string | number | null | undefined, context: TenantContextInfo, label: string) {
  const normalized = normalizeTenantId(value);
  if (!normalized) return;
  if (!getAllowedTenantValues(context).has(normalized)) {
    throw new Error(
      `${TENANT_ISOLATION_ERROR}: ${label} tenant '${normalized}' does not match request tenant '${context.tenantSlug}'.`
    );
  }
}

function assertAllowedBoundaryTenantValue(value: string | number | null | undefined, context: TenantContextInfo, label: string) {
  const normalized = normalizeTenantId(value);
  if (!normalized) return;
  if (!getAllowedBoundaryTenantValues(context).has(normalized)) {
    throw new Error(
      `${TENANT_ISOLATION_ERROR}: ${label} tenant '${normalized}' does not match request tenant '${context.tenantSlug}'.`
    );
  }
}

export function assertTenantContextMatch(input: TenantMatchInput): void {
  const headerTenant = normalizeTenantId(input.headerTenant);
  const headerTenantId = normalizeTenantId(input.headerTenantId);
  const authTenantId = normalizeTenantId(input.authTenantId);

  assertAllowedBoundaryTenantValue(input.routeTenant.subdomainTenant, input.routeTenant, 'subdomain');
  assertAllowedBoundaryTenantValue(headerTenant, input.routeTenant, 'x-tenant');
  assertAllowedBoundaryTenantValue(headerTenantId, input.routeTenant, 'x-tenant-id');
  assertAllowedBoundaryTenantValue(authTenantId, input.routeTenant, 'JWT/API auth');
}

export function assertTenantScopedOperation(
  model: string,
  operation: string,
  args: unknown,
  tenantId?: string
): true {
  const opRequiresScope = [
    'findMany',
    'findFirst',
    'count',
    'aggregate',
    'groupBy',
    'update',
    'updateMany',
    'delete',
    'deleteMany',
    'upsert',
  ].includes(operation);

  if (!opRequiresScope) return true;

  const where = (args as { where?: { tenantId?: unknown } } | undefined)?.where;
  if (!where || where.tenantId === undefined || where.tenantId === null) {
    throw new Error(`${TENANT_ISOLATION_ERROR}: ${model}.${operation} is missing tenantId scope.`);
  }

  if (tenantId) {
    assertAllowedTenantValue(String(where.tenantId), buildTenantContext(tenantId, 'assertion'), `${model}.${operation}`);
  }

  return true;
}
