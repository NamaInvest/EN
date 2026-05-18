export {
  TENANT_ISOLATION_ERROR,
  assertTenant,
  assertTenantContextMatch,
  assertTenantScopedOperation,
  buildTenantContext,
  ensureTenantWhere,
  getAllowedTenantValues,
  getRecordTenantId,
  getTenantMode,
  isLegacyTenant,
  isSystemTenant,
  normalizeTenantId,
  requireTenantFilter,
  requireTenantId,
  validateTenantAccess,
} from '../governance/tenant-guard';

export type { TenantContextInfo, TenantMatchInput, TenantMode, TenantWhere } from '../governance/tenant-guard';
