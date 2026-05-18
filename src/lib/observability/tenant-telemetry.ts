/**
 * Phase 9.2 — Tenant-Aware Telemetry
 * ─────────────────────────────────────
 * Provides structured logging and metrics scoped to individual tenants.
 * All functions are tenant-safe: they never mix data across tenants.
 *
 * Covers:
 * - Tenant isolation violations (CRITICAL)
 * - Tenant provisioning lifecycle
 * - Per-tenant operation counters
 * - Tenant-scoped override frequency tracking
 * - Suspicious cross-tenant access attempts
 */

import { getRequestContext } from './request-context';
import { logger } from './logger';

// ── In-memory per-tenant operation counters ───────────────────────────────────
// These are lightweight, non-persistent counters for runtime visibility.
// For persistent metrics, use the Prometheus registry in instrumentation/metrics.ts

interface TenantMetrics {
  operationCount: number;
  overrideCount: number;
  violationCount: number;
  lastActivity: Date;
}

const tenantMetricsStore = new Map<string, TenantMetrics>();

function getTenantMetrics(tenantId: string): TenantMetrics {
  if (!tenantMetricsStore.has(tenantId)) {
    tenantMetricsStore.set(tenantId, {
      operationCount: 0,
      overrideCount: 0,
      violationCount: 0,
      lastActivity: new Date(),
    });
  }
  return tenantMetricsStore.get(tenantId)!;
}

// ── Tenant Isolation Violations ───────────────────────────────────────────────

/**
 * Records a cross-tenant access attempt.
 * This is a CRITICAL security event — should trigger alerting.
 */
export function recordTenantViolation(
  attemptedTenantId: string,
  resource: string,
  action: string,
  extra?: Record<string, unknown>
): void {
  const ctx = getRequestContext();
  const authenticatedTenantId = ctx?.tenantId ?? 'UNKNOWN';

  // Increment violation counter
  const metrics = getTenantMetrics(authenticatedTenantId);
  metrics.violationCount++;
  metrics.lastActivity = new Date();

  logger.error('Tenant Isolation Violation Detected', {
    severity: 'CRITICAL',
    violationType: 'CROSS_TENANT_ACCESS',
    authenticatedTenantId,
    attemptedTenantId,
    resource,
    action,
    actorId: ctx?.actorId,
    actorRole: ctx?.actorRole,
    requestId: ctx?.requestId,
    ...extra,
  });
}

// ── Tenant Provisioning ───────────────────────────────────────────────────────

/**
 * Logs tenant provisioning lifecycle events (STARTED, SUCCESS, FAILED).
 */
export function logTenantProvisioning(
  tenantId: string,
  status: 'STARTED' | 'SUCCESS' | 'FAILED',
  durationMs?: number,
  error?: string
): void {
  const level = status === 'FAILED' ? 'error' : 'info';
  logger[level](`Tenant Provisioning ${status}`, {
    module: 'provisioning',
    operationType: 'TENANT_PROVISION',
    tenantId,
    status,
    durationMs,
    ...(error ? { error } : {}),
  });
}

// ── Tenant Operation Tracking ─────────────────────────────────────────────────

/**
 * Records a financial operation for a tenant (non-persistent counter).
 * Call this when any financial mutation succeeds.
 */
export function recordTenantOperation(
  tenantId: string,
  operationType: string,
  module: string,
  durationMs?: number
): void {
  if (!tenantId || tenantId.toLowerCase() === 'default') return;

  const metrics = getTenantMetrics(tenantId);
  metrics.operationCount++;
  metrics.lastActivity = new Date();

  logger.info('Tenant operation recorded', {
    module,
    operationType,
    tenantId,
    financialImpact: true,
    durationMs,
  });
}

/**
 * Records an override event for a tenant.
 * Used to track override frequency per tenant for compliance reporting.
 */
export function recordTenantOverride(
  tenantId: string,
  module: string,
  operationType: string,
  actorId: string,
  reason?: string
): void {
  if (!tenantId) return;

  const metrics = getTenantMetrics(tenantId);
  metrics.overrideCount++;
  metrics.lastActivity = new Date();

  logger.override('Tenant SOFT_LOCK override recorded', {
    module,
    operationType,
    tenantId,
    actorId,
    reason: reason ? reason.slice(0, 200) : undefined, // truncate for log safety
    overrideUsed: true,
    severity: 'CRITICAL',
  });
}

// ── Tenant Metrics Summary ────────────────────────────────────────────────────

/**
 * Returns the in-memory runtime metrics for a specific tenant.
 * For persistent metrics, query the AuditLog and OutboxEvent tables.
 */
export function getTenantRuntimeMetrics(tenantId: string): TenantMetrics | null {
  return tenantMetricsStore.get(tenantId) ?? null;
}

/**
 * Returns all tenant runtime metrics (for admin/ICE dashboards).
 * Only for MASTER_ADMIN use — never expose to regular tenants.
 */
export function getAllTenantRuntimeMetrics(): Record<string, TenantMetrics> {
  return Object.fromEntries(tenantMetricsStore.entries());
}

/**
 * Resets runtime metrics for a tenant (e.g., after period close).
 */
export function resetTenantMetrics(tenantId: string): void {
  tenantMetricsStore.delete(tenantId);
}
