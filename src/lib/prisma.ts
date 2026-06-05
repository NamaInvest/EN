/**
 * Multi-tenant Prisma access layer.
 *
 * This file is the enforcement point between route tenant context and database
 * access. API routes should use `getPrisma(req)` or the default smart proxy;
 * tenant-scoped Prisma models are automatically constrained here.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
import { applySoftDeleteMiddleware } from './prisma-soft-delete';
import { applyAuditMiddleware } from './prisma-audit';
import { logger } from '@/lib/logger';
import {
  TENANT_ISOLATION_ERROR,
  TenantContextInfo,
  buildTenantContext,
  getRecordTenantId,
  normalizeTenantId,
} from '@/lib/governance/tenant-guard';

const log = logger.child({ service: 'prisma' });

export const tenantContext = new AsyncLocalStorage<string>();
export const currentRequestStore = new AsyncLocalStorage<string>();

const globalForPrisma = globalThis as unknown as {
  prismaPool?: Map<string, PrismaClient>;
};

const pool = globalForPrisma.prismaPool || new Map<string, PrismaClient>();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaPool = pool;

const TENANT_SCOPED_MODELS = new Set(
  Prisma.dmmf.datamodel.models
    .filter((model) => model.fields.some((field) => field.name === 'tenantId'))
    .map((model) => model.name)
);

const SYSTEM_MODELS = new Set(['Tenant', 'TenantAccount', 'Session', 'SystemSetting', 'DesktopLicense', 'TenantFeatureFlag']);
const REAL_TENANT_ID_MODELS = new Set(['OutboxEvent', 'IdempotencyRecord']);
const SCOPED_READ_WRITE_OPS = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);
const SCOPED_CREATE_OPS = new Set(['create', 'createMany']);

type TenantRequest = {
  headers?: { get?: (k: string) => string | null; [k: string]: unknown };
};
type PrismaArgs = Record<string, unknown>;

export interface ResolveTenantOptions {
  requireTenant?: boolean;
  allowEnvFallback?: boolean;
}

function isTenantScopedModel(model?: string): model is string {
  return Boolean(model && TENANT_SCOPED_MODELS.has(model) && !SYSTEM_MODELS.has(model));
}

function expectedTenantIdForModel(model: string, routeTenant: string): string {
  return REAL_TENANT_ID_MODELS.has(model) ? routeTenant : getRecordTenantId(routeTenant);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function assertTenantValueAllowed(value: unknown, model: string, operation: string, routeTenant: string, expectedTenantId: string) {
  if (value === undefined || value === null || isPlainObject(value)) return;

  const normalized = normalizeTenantId(String(value));
  if (!normalized) return;

  const allowed = new Set([routeTenant, expectedTenantId]);
  if (!allowed.has(normalized)) {
    throw new Error(
      `${TENANT_ISOLATION_ERROR}: ${model}.${operation} attempted tenant '${normalized}' while request tenant is '${routeTenant}'.`
    );
  }
}

function scopeWhere(args: PrismaArgs, model: string, operation: string, routeTenant: string, expectedTenantId: string): PrismaArgs {
  const where = isPlainObject(args.where) ? args.where : {};
  assertTenantValueAllowed(where.tenantId, model, operation, routeTenant, expectedTenantId);
  return { ...args, where: { ...where, tenantId: expectedTenantId } };
}

function scopeCreateData(data: unknown, model: string, operation: string, routeTenant: string, expectedTenantId: string): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => scopeCreateData(entry, model, operation, routeTenant, expectedTenantId));
  }
  if (!isPlainObject(data)) return { tenantId: expectedTenantId };

  assertTenantValueAllowed(data.tenantId, model, operation, routeTenant, expectedTenantId);
  return { ...data, tenantId: expectedTenantId };
}

function scopeTenantArgs(args: unknown, model: string | undefined, operation: string, routeTenant: string): unknown {
  if (!isTenantScopedModel(model)) return args;

  const expectedTenantId = expectedTenantIdForModel(model, routeTenant);
  let scopedArgs: PrismaArgs = isPlainObject(args) ? { ...args } : {};

  if (SCOPED_READ_WRITE_OPS.has(operation)) {
    scopedArgs = scopeWhere(scopedArgs, model, operation, routeTenant, expectedTenantId);
  } else if (SCOPED_CREATE_OPS.has(operation)) {
    scopedArgs = { ...scopedArgs, data: scopeCreateData(scopedArgs.data, model, operation, routeTenant, expectedTenantId) };
  } else if (operation === 'upsert') {
    scopedArgs = scopeWhere(scopedArgs, model, operation, routeTenant, expectedTenantId);
    scopedArgs = {
      ...scopedArgs,
      create: scopeCreateData(scopedArgs.create, model, operation, routeTenant, expectedTenantId),
    };
  }

  return scopedArgs;
}

export function getDbUrl(tenant: string, isRead = false): string {
  let base = process.env.DATABASE_URL;
  if (isRead && process.env.DATABASE_REPLICA_URL) {
    base = process.env.DATABASE_REPLICA_URL;
  }
  if (!base) {
    throw new Error('DATABASE_URL environment variable is required (set in .env)');
  }

  try {
    const urlObj = new URL(base);
    if (!urlObj.searchParams.has('pgbouncer')) {
      urlObj.searchParams.set('pgbouncer', 'true');
    }
    if (!urlObj.searchParams.has('connection_limit')) {
      urlObj.searchParams.set('connection_limit', '5');
    }
    if (!urlObj.searchParams.has('pool_timeout')) {
      urlObj.searchParams.set('pool_timeout', '10');
    }
    base = urlObj.toString();
  } catch (e) {
    log.warn(`Failed to append connection limits to DB URL: ${(e as Error).message}`);
  }

  if (process.env.DESKTOP_MODE === 'true') return base;
  if (tenant === 'n11' || tenant === 'default') return base;

  return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

function withTenantScope(client: PrismaClient, tenantId: string) {
  return client.$extends({
    name: 'tenant-auto-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Central guardrail: every model with tenantId is scoped here before
          // the underlying Prisma client sees the operation.
          const scopedArgs = scopeTenantArgs(args, model, operation, tenantId) as typeof args;
          if (isTenantScopedModel(model) && SCOPED_READ_WRITE_OPS.has(operation)) {
            const guardedArgs: Record<string, unknown> = isPlainObject(scopedArgs as unknown)
              ? (scopedArgs as unknown as Record<string, unknown>)
              : {};
            const where = isPlainObject(guardedArgs.where) ? guardedArgs.where : {};
            if (where.tenantId === undefined || where.tenantId === null) {
              throw new Error(
                `${TENANT_ISOLATION_ERROR}: Operation '${operation}' on model '${model}' rejected. Missing tenantId after tenant auto-scope.`
              );
            }
          }
          return query(scopedArgs);
        },
      },
    },
  });
}

export function getClient(tenant: string, options: { read?: boolean } = {}) {
  const isRead = !!options.read;
  const dbUrl = getDbUrl(tenant, isRead);
  const poolKey = isRead ? `READ_${dbUrl}` : `WRITE_${dbUrl}`;

  if (!pool.has(poolKey)) {
    const rawClient = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });

    applySoftDeleteMiddleware(rawClient);
    applyAuditMiddleware(rawClient);

    pool.set(poolKey, rawClient);
  }

  return withTenantScope(pool.get(poolKey)!, tenant) as unknown as PrismaClient;
}

function headerValue(headers: TenantRequest['headers'] | undefined, name: string): string | null {
  if (!headers) return null;
  if (typeof headers.get === 'function') return normalizeTenantId(headers.get(name));
  return normalizeTenantId(headers[name] as string | undefined);
}

function tenantFromHost(host?: string | null): string | null {
  const normalizedHost = normalizeTenantId(host);
  if (!normalizedHost || !normalizedHost.endsWith('.namainvist.com')) return null;
  const tenant = normalizedHost.replace('.namainvist.com', '').split(':')[0];
  if (tenant === 'www' || tenant === 'app') return null;
  return normalizeTenantId(tenant);
}

export function resolveTenantContext(req?: TenantRequest, options: ResolveTenantOptions = {}): TenantContextInfo {
  const requireTenant = options.requireTenant ?? false;
  const allowEnvFallback = options.allowEnvFallback ?? !requireTenant;

  if (process.env.DESKTOP_MODE === 'true') {
    return buildTenantContext('local', 'desktop-mode');
  }

  const ctx = normalizeTenantId(tenantContext.getStore());
  if (ctx) return buildTenantContext(ctx, 'async-tenant-context');

  const reqCtx = normalizeTenantId(currentRequestStore.getStore());
  if (reqCtx) return buildTenantContext(reqCtx, 'request-context');

  const headerTenant = headerValue(req?.headers, 'x-tenant');
  const headerTenantId = headerValue(req?.headers, 'x-tenant-id');
  const headerSubdomain = headerValue(req?.headers, 'x-tenant-subdomain');
  const hostTenant = tenantFromHost(headerValue(req?.headers, 'host'));
  const requestTenant = headerTenant || headerTenantId || headerSubdomain || hostTenant;

  if (requestTenant) {
    return buildTenantContext(requestTenant, 'request', {
      headerTenant: headerTenant || headerTenantId || headerSubdomain,
      subdomainTenant: hostTenant,
    });
  }

  try {
    const { headers } = require('next/headers');
    const hObj = headers();
    if (hObj && typeof hObj.get === 'function') {
      const nextTenant =
        normalizeTenantId(hObj.get('x-tenant')) ||
        normalizeTenantId(hObj.get('x-tenant-id')) ||
        normalizeTenantId(hObj.get('x-tenant-subdomain')) ||
        tenantFromHost(hObj.get('host'));
      if (nextTenant) return buildTenantContext(nextTenant, 'next-headers');
    }
  } catch { /* ignore */ }

  const envTenant = normalizeTenantId(process.env.TENANT) || normalizeTenantId(process.env.DEFAULT_TENANT);
  if (allowEnvFallback && envTenant) return buildTenantContext(envTenant, 'environment');
  if (allowEnvFallback) return buildTenantContext('n11', 'legacy-fallback');

  throw new Error(`${TENANT_ISOLATION_ERROR}: Missing tenant context for tenant-required request.`);
}

export function resolveTenant(req?: TenantRequest, options: ResolveTenantOptions = {}): string {
  return resolveTenantContext(req, options).tenantSlug;
}

export function getPrisma(req?: Request | TenantRequest, options: { read?: boolean; requireTenant?: boolean } = {}): PrismaClient {
  const tenant = resolveTenant(req as TenantRequest, {
    requireTenant: options.requireTenant,
    allowEnvFallback: options.requireTenant ? false : undefined,
  });
  return getClient(tenant, { read: options.read });
}

export const getTenantPrisma = getPrisma;

export async function withTenant<T>(tenant: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(tenant, fn);
}

function getTenantFromNextContext(): string | null {
  try {
    const workUnitStore = (globalThis as any).__NEXT_REQUEST_CONTEXT__?.get?.();
    if (workUnitStore?.headers) {
      const tenant =
        workUnitStore.headers.get?.('x-tenant') ||
        workUnitStore.headers.get?.('x-tenant-id') ||
        workUnitStore.headers['x-tenant'] ||
        workUnitStore.headers['x-tenant-id'];
      return normalizeTenantId(tenant);
    }
  } catch { /* ignore */ }
  return null;
}

const smartPrisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    let tenant: string | null | undefined = tenantContext.getStore() || currentRequestStore.getStore();
    if (!tenant) tenant = getTenantFromNextContext();
    if (!tenant) tenant = process.env.TENANT || process.env.DEFAULT_TENANT || 'n11';

    const client = getClient(tenant);
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export { smartPrisma as prisma };
export default smartPrisma;
