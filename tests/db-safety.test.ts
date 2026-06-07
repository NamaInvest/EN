import { describe, it, expect } from 'vitest';
import { 
  assertNotProductionDatabaseUrl, 
  assertTestDatabaseUrl, 
  requireExplicitTestMode, 
  validateDisposableDatabaseName 
} from './harness/test-db-guard';
import { buildSeedPlanOnly } from './harness/seed-plan';

describe('Database Safety Guard Checks', () => {
  
  // 1. assertNotProductionDatabaseUrl
  it('should throw an error for production-like DATABASE_URL', () => {
    const urls = [
      'postgresql://user:pass@main-db.namainvist.com:5432/erp-prod',
      'postgresql://admin:123@hetzner-srv:5432/live-db',
      'postgresql://localhost:5432/production-erp'
    ];

    for (const url of urls) {
      expect(() => assertNotProductionDatabaseUrl(url)).toThrow('CRITICAL: Production database URL keyword');
    }
  });

  it('should pass for safe local or test URLs', () => {
    const urls = [
      'postgresql://localhost:5432/test-erp',
      'file:d:/namasoft9-3-main/prisma/disposable_db.sqlite',
      'postgresql://127.0.0.1:5432/disposable'
    ];

    for (const url of urls) {
      expect(() => assertNotProductionDatabaseUrl(url)).not.toThrow();
    }
  });

  // 2. assertTestDatabaseUrl
  it('should throw for database URLs without test indicators', () => {
    const url = 'postgresql://somehost:5432/namasoft';
    expect(() => assertTestDatabaseUrl(url)).toThrow('does not contain required test/disposable/localhost indicators');
  });

  it('should pass for URLs with test/disposable/localhost indicators', () => {
    expect(() => assertTestDatabaseUrl('postgresql://localhost:5432/some-db')).not.toThrow();
    expect(() => assertTestDatabaseUrl('postgresql://remote-host:5432/testdb')).not.toThrow();
    expect(() => assertTestDatabaseUrl('postgresql://remote-host:5432/disposable')).not.toThrow();
  });

  // 3. requireExplicitTestMode
  it('should throw if NODE_ENV is not test and TEST_MODE is not true', () => {
    expect(() => requireExplicitTestMode({ NODE_ENV: 'production', TEST_MODE: 'false' })).toThrow(
      'Explicit test mode guard violation'
    );
  });

  it('should pass if NODE_ENV is test or TEST_MODE is true', () => {
    expect(() => requireExplicitTestMode({ NODE_ENV: 'test', TEST_MODE: 'false' })).not.toThrow();
    expect(() => requireExplicitTestMode({ NODE_ENV: 'development', TEST_MODE: 'true' })).not.toThrow();
  });

  // 4. validateDisposableDatabaseName
  it('should throw if parsed database name does not contain test/disposable/sqlite', () => {
    expect(() => validateDisposableDatabaseName('postgresql://localhost:5432/myerp')).toThrow(
      'must contain "test", "disposable", or "sqlite"'
    );
  });

  it('should pass if database name is sqlite or contains test/disposable', () => {
    expect(() => validateDisposableDatabaseName('postgresql://localhost:5432/erp_test_db')).not.toThrow();
    expect(() => validateDisposableDatabaseName('file:disposable.sqlite')).not.toThrow();
  });

  // 5. Seed plan returns correct objects without writes
  it('should build seed plan without performing any database write', () => {
    const plan = buildSeedPlanOnly('GROUP_A_FINANCE', 'my-test-tenant');
    expect(plan.groupName).toBe('GROUP_A_FINANCE');
    expect(plan.tenant.slug).toBe('my-test-tenant');
    expect(plan.data.accounts.length).toBeGreaterThan(0);
  });

});
