import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runProvisioningWorkerDryRun } from '@/lib/tenant/provisioning-worker';
import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';
import { Client } from 'pg';

describe('Provisioning Worker Real Writes & Allowlist Enforcement Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv('CUSTOMER_ONBOARDING_QUEUE_ENABLED', 'true');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ENABLED', 'true');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_DRY_RUN', 'false');
    vi.stubEnv('CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED', 'true');
    vi.stubEnv('CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV', 'test');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('CUSTOMER_ONBOARDING_ALLOWLIST', 'beta-test');
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    
    // Clean up master database mock records
    const { PrismaClient } = await import('@prisma/client');
    const masterPrisma = new PrismaClient();
    try {
      const acc = await masterPrisma.tenantAccount.findFirst({ where: { subdomain: 'beta-test' } });
      if (acc) {
        await masterPrisma.desktopLicense.deleteMany({ where: { tenantAccountId: acc.id } });
        await masterPrisma.tenantAccount.delete({ where: { id: acc.id } });
      }
    } catch (e) {
      // Ignore cleanup errors
    } finally {
      await masterPrisma.$disconnect().catch(() => {});
    }

    // Clean up temporary database after tests
    const base = process.env.DATABASE_URL;
    if (base) {
      const rootUrl = base.replace(/\/([^/?]+)(\?|$)/, `/postgres$2`);
      const client = new Client({ connectionString: rootUrl });
      try {
        await client.connect();
        await client.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = 'beta-test_db'
            AND pid <> pg_backend_pid();
        `).catch(() => {});
        await client.query('DROP DATABASE IF EXISTS "beta-test_db"');
      } catch (e) {
        // Ignore drop errors
      } finally {
        await client.end().catch(() => {});
      }
    }
  });

  it('rejects provisioning request early with SUBDOMAIN_NOT_ALLOWED for domains not in the allowlist', async () => {
    const payload = {
      provisioningRunId: 'run_real_fail_allowlist',
      requestedSubdomain: 'unauthorized-subdomain',
    };

    await expect(runProvisioningWorkerDryRun(payload, { realWrites: true }))
      .rejects
      .toEqual(expect.objectContaining({
        code: 'SUBDOMAIN_NOT_ALLOWED'
      }));
  });

  it('rejects provisioning request early if CUSTOMER_ONBOARDING_ALLOWLIST is missing/empty', async () => {
    vi.stubEnv('CUSTOMER_ONBOARDING_ALLOWLIST', '');
    
    const payload = {
      provisioningRunId: 'run_real_fail_missing_allowlist',
      requestedSubdomain: 'beta-test',
    };

    await expect(runProvisioningWorkerDryRun(payload, { realWrites: true }))
      .rejects
      .toEqual(expect.objectContaining({
        code: 'SUBDOMAIN_NOT_ALLOWED'
      }));
  });

  it('successfully creates PostgreSQL database and seeds data for allowed subdomain', async () => {
    const { startProvisioningWorker, stopProvisioningWorker } = await import('@/lib/tenant/provisioning-worker');
    
    const adapter = getProvisioningQueueAdapter();
    const runId = 'run_real_success_beta';
    
    const payload = {
      provisioningRunId: runId,
      tenantName: 'مؤسسة التجربة التجريبية',
      requestedSubdomain: 'beta-test',
      ownerName: 'المدير التجريبي',
      ownerEmail: 'beta@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      password: 'password123',
      username: 'beta_admin',
      initialStatus: 'PENDING' as const
    };

    await adapter.enqueueProvisioningJob(payload);

    // Start real background worker loop
    startProvisioningWorker();

    // Poll until complete (Up to 50 seconds)
    let status = '';
    let lastState: any = null;
    for (let attempt = 0; attempt < 500; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await adapter.getProvisioningJobStatus(runId);
      lastState = state;
      status = state?.status || '';
      if (status === 'READY' || status === 'FAILED') break;
    }

    stopProvisioningWorker();

    if (status !== 'READY') {
      console.error('Job failed or timed out. Last state:', lastState);
    }

    expect(status).toBe('READY');

    const finalState = await adapter.getProvisioningJobStatus(runId);
    expect(finalState?.completedAt).toBeInstanceOf(Date);
    expect(finalState?.failedAt).toBeNull();

    // Verify physical database was successfully created
    const base = process.env.DATABASE_URL;
    if (base) {
      const rootUrl = base.replace(/\/([^/?]+)(\?|$)/, `/postgres$2`);
      const client = new Client({ connectionString: rootUrl });
      await client.connect();
      const dbRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'beta-test_db'");
      expect(dbRes.rowCount).toBe(1);
      await client.end();
    }
  }, 60000);
});
