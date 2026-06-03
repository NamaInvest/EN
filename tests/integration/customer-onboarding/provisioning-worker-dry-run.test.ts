import { runProvisioningWorkerDryRun } from '@/lib/tenant/provisioning-worker';

describe('Provisioning Worker Dry-Run Tests', () => {
  it('successfully executes all steps in dry-run mode and returns the correct timeline structure', async () => {
    const payload = {
      provisioningRunId: 'run_dry_run_success',
      requestedSubdomain: 'dry-run-success',
      correlationId: 'corr_dry_run_success',
    };

    const result = await runProvisioningWorkerDryRun(payload);

    expect(result.success).toBe(true);
    expect(result.runId).toBe(payload.provisioningRunId);
    expect(result.correlationId).toBe(payload.correlationId);
    expect(result.status).toBe('READY');
    expect(result.timeline).toBeInstanceOf(Array);
    expect(result.timeline.length).toBe(10);

    // Verify step fields
    for (const stepResult of result.timeline) {
      expect(stepResult.provisioningRunId).toBe(payload.provisioningRunId);
      expect(stepResult.correlationId).toBe(payload.correlationId);
      expect(stepResult.dryRun).toBe(true);
      expect(stepResult.status).toBe('COMPLETED');
      expect(stepResult.startedAt).toBeInstanceOf(Date);
      expect(stepResult.finishedAt).toBeInstanceOf(Date);
      expect(typeof stepResult.durationMs).toBe('number');
      expect(typeof stepResult.wouldWrite).toBe('boolean');
      expect(typeof stepResult.writeTarget).toBe('string');
      expect(typeof stepResult.message).toBe('string');
      expect(stepResult.warnings).toBeInstanceOf(Array);

      // Verify no secrets exist in the messages
      expect(stepResult.message).not.toContain('password');
      expect(stepResult.message).not.toContain('key');
      expect(stepResult.message).not.toContain('token');
      expect(stepResult.message).not.toContain('secret');
    }
  });

  it('rejects execution when real writes options are passed', async () => {
    const originalWorker = process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED;
    const originalDryRun = process.env.CUSTOMER_ONBOARDING_WORKER_DRY_RUN;
    const originalWrites = process.env.CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED;
    const originalAllowedEnv = process.env.CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV;
    const originalAllowlist = process.env.CUSTOMER_ONBOARDING_ALLOWLIST;
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = 'true';
    process.env.CUSTOMER_ONBOARDING_WORKER_DRY_RUN = 'false';
    process.env.CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED = 'true';
    process.env.CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV = 'production';
    process.env.CUSTOMER_ONBOARDING_ALLOWLIST = 'try-real-subdomain';
    (process.env as any).NODE_ENV = 'production';

    try {
      const payload = {
        provisioningRunId: 'run_try_real',
        requestedSubdomain: 'try-real-subdomain',
      };

      await expect(runProvisioningWorkerDryRun(payload, { realWrites: true }))
        .rejects
        .toThrow('REAL_PROVISIONING_WORKER_DISABLED');
    } finally {
      process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = originalWorker;
      process.env.CUSTOMER_ONBOARDING_WORKER_DRY_RUN = originalDryRun;
      process.env.CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED = originalWrites;
      process.env.CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV = originalAllowedEnv;
      process.env.CUSTOMER_ONBOARDING_ALLOWLIST = originalAllowlist;
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it('fails early and returns FAILED status if subdomain validation fails', async () => {
    const payload = {
      provisioningRunId: 'run_fail_validation',
      requestedSubdomain: 'a', // Too short
    };

    const result = await runProvisioningWorkerDryRun(payload);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errorCode).toBe('SUBDOMAIN_TOO_SHORT');
    expect(result.errorMessage).toContain('3 رموز على الأقل');
    expect(result.timeline.length).toBe(1);
    expect(result.timeline[0].step).toBe('VALIDATE_REQUEST');
    expect(result.timeline[0].status).toBe('FAILED');
  });

  it('fails early if a reserved subdomain is provided', async () => {
    const payload = {
      provisioningRunId: 'run_fail_reserved',
      requestedSubdomain: 'admin', // Reserved subdomain
    };

    const result = await runProvisioningWorkerDryRun(payload);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errorCode).toBe('RESERVED_SUBDOMAIN');
    expect(result.errorMessage).toContain('محجوز لأغراض تشغيلية');
    expect(result.timeline.length).toBe(1);
    expect(result.timeline[0].step).toBe('VALIDATE_REQUEST');
    expect(result.timeline[0].status).toBe('FAILED');
  });

  it('fails at CREATE_TENANT_RECORD if fail-db trigger is in subdomain name', async () => {
    const payload = {
      provisioningRunId: 'run_fail_db_trigger',
      requestedSubdomain: 'fail-db-mock',
    };

    const result = await runProvisioningWorkerDryRun(payload);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errorCode).toBe('DATABASE_CREATION_FAILED');
    expect(result.errorMessage).toContain('تعذر إعداد قاعدة البيانات');
    expect(result.timeline.length).toBe(3); // VALIDATE_REQUEST -> RESERVE_SUBDOMAIN -> CREATE_TENANT_RECORD (failed)
    expect(result.timeline[2].step).toBe('CREATE_TENANT_RECORD');
    expect(result.timeline[2].status).toBe('FAILED');
  });

  it('fails at SEED_INITIAL_DATA if fail-seed trigger is in subdomain name', async () => {
    const payload = {
      provisioningRunId: 'run_fail_seed_trigger',
      requestedSubdomain: 'fail-seed-mock',
    };

    const result = await runProvisioningWorkerDryRun(payload);

    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errorCode).toBe('SEED_DATA_FAILED');
    expect(result.errorMessage).toContain('فشل زرع البيانات المحاسبية');
    expect(result.timeline.length).toBe(5); // VALIDATE_REQUEST -> ... -> SEED_INITIAL_DATA (failed)
    expect(result.timeline[4].step).toBe('SEED_INITIAL_DATA');
    expect(result.timeline[4].status).toBe('FAILED');
  });
});
