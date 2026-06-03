import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  validateRealWriteAllowed, 
  isQueueEnabled, 
  isWorkerEnabled, 
  isDryRunEnabled, 
  isRealWritesEnabled 
} from '@/lib/tenant/provisioning-guard';
import { runProvisioningWorkerDryRun } from '@/lib/tenant/provisioning-worker';

describe('Provisioning Worker Guards & Fail-Closed Protection Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset all flags to default (production-safe / fail-closed)
    vi.stubEnv('CUSTOMER_ONBOARDING_QUEUE_ENABLED', 'false');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'false');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'true');
    vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'false');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'development');
    vi.stubEnv('CUSTOMER_ONBOARDING_KILL_SWITCH', 'false');
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Feature Flag Resolution', () => {
    it('defaults to fail-closed configuration in absence of env vars', () => {
      expect(isQueueEnabled()).toBe(false);
      expect(isWorkerEnabled()).toBe(false);
      expect(isDryRunEnabled()).toBe(true); // Should simulate by default
      expect(isRealWritesEnabled()).toBe(false);
    });

    it('resolves correct values when flags are explicitly set', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_QUEUE_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');

      expect(isQueueEnabled()).toBe(true);
      expect(isWorkerEnabled()).toBe(true);
      expect(isDryRunEnabled()).toBe(false);
      expect(isRealWritesEnabled()).toBe(true);
    });
  });

  describe('validateRealWriteAllowed Multi-Layer Guard', () => {
    it('denies real writes when worker is disabled', () => {
      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('WORKER_DISABLED');
    });

    it('denies real writes when dry-run mode is enabled (default)', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      // CUSTOMER_ONBOARDING_WORKER_DRY_RUN is 'true'
      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('DRY_RUN_ENABLED');
    });

    it('denies real writes when writes flag is disabled', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      // CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED is 'false'
      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('REAL_WRITES_DISABLED');
    });

    it('denies real writes when NODE_ENV does not match allowed environment', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'development');
      vi.stubEnv('NODE_ENV', 'production'); // Production tries to execute development allowed worker

      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('ENVIRONMENT_MISMATCH');
    });

    it('denies real writes when kill switch is active', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_KILL_SWITCH', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');

      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('KILL_SWITCH_ACTIVE');
    });

    it('denies real writes when subdomain is not on the allowlist (if allowlist configured)', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CUSTOMER_ONBOARDING_ALLOWLIST', 'alpha,beta,gamma');

      const result = validateRealWriteAllowed('unauthorized-subdomain', 'run_123');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SUBDOMAIN_NOT_ALLOWED');
    });

    it('allows real writes only when all parameters and security gates align', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');

      const result = validateRealWriteAllowed('test-subdomain', 'run_123');
      expect(result.allowed).toBe(true);
    });

    it('fails closed when parameters are missing', () => {
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');

      const resultNoRun = validateRealWriteAllowed('test-subdomain', '');
      expect(resultNoRun.allowed).toBe(false);
      expect(resultNoRun.code).toBe('RUN_ID_REQUIRED');

      const resultNoSub = validateRealWriteAllowed('', 'run_123');
      expect(resultNoSub.allowed).toBe(false);
      expect(resultNoSub.code).toBe('SUBDOMAIN_REQUIRED');
    });
  });

  describe('runProvisioningWorkerDryRun Guard Integration', () => {
    it('enforces guards and rejects real writes when options are passed even under simulated envs', async () => {
      const payload = {
        provisioningRunId: 'run_worker_test',
        requestedSubdomain: 'subdomain-test',
      };

      // By default with all flags off, it should throw because of the first guard check (WORKER_DISABLED)
      await expect(runProvisioningWorkerDryRun(payload, { realWrites: true }))
        .rejects
        .toEqual(expect.objectContaining({
          code: 'WORKER_DISABLED'
        }));
    });

    it('stops execution even if all guards are active (Fail-Closed Phase Gate)', async () => {
      // Configure env to allow writes
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
      vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
      vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');

      const payload = {
        provisioningRunId: 'run_worker_test',
        requestedSubdomain: 'subdomain-test',
      };

      // In this Phase 4E-B, real writes are still not implemented so it must still fail with REAL_PROVISIONING_WORKER_DISABLED
      await expect(runProvisioningWorkerDryRun(payload, { realWrites: true }))
        .rejects
        .toThrow('REAL_PROVISIONING_WORKER_DISABLED');
    });
  });
});
