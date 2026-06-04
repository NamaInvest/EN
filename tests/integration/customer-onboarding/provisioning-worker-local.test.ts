import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';
import { startProvisioningWorker, stopProvisioningWorker } from '@/lib/tenant/provisioning-worker';

describe('Provisioning Worker Local Integration Tests', () => {
  const adapter = getProvisioningQueueAdapter();

  let originalWorkerEnabled: string | undefined;

  beforeAll(() => {
    originalWorkerEnabled = process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED;
    process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = 'true';
    // Start background worker
    startProvisioningWorker();
  });

  afterAll(() => {
    // Stop background worker
    stopProvisioningWorker();
    if (originalWorkerEnabled === undefined) {
      delete process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED;
    } else {
      process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = originalWorkerEnabled;
    }
  });

  it('automatically processes a pending job and marks it as READY for valid subdomain', async () => {
    const runId = 'run_worker_success';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة النجاح المحدودة',
      requestedSubdomain: 'success-subdomain',
      ownerName: 'المدير العام',
      ownerEmail: 'success@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'PENDING' as const,
    };

    // Enqueue
    await adapter.enqueueProvisioningJob(payload);

    // Wait for worker loop (simulated execution takes ~500ms total)
    // We will poll every 100ms up to 2 seconds to check if status transitions to READY
    let status = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await adapter.getProvisioningJobStatus(runId);
      status = state?.status || '';
      if (status === 'READY') break;
    }

    expect(status).toBe('READY');
    const finalState = await adapter.getProvisioningJobStatus(runId);
    expect(finalState?.completedAt).toBeInstanceOf(Date);
    expect(finalState?.failedAt).toBeNull();

    // Check timeline events
    const timeline = await adapter.getProvisioningTimeline(runId);
    expect(timeline.some(t => t.step === 'MARK_READY' && t.status === 'READY')).toBe(true);
  });

  it('marks job as FAILED if simulated database creation error is triggered', async () => {
    const runId = 'run_worker_failed_db';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة الفشل قاعدة بيانات',
      requestedSubdomain: 'mock-fail-db', // triggers fail-db simulation
      ownerName: 'المدير العام',
      ownerEmail: 'fail-db@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'PENDING' as const,
    };

    await adapter.enqueueProvisioningJob(payload);

    let status = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await adapter.getProvisioningJobStatus(runId);
      status = state?.status || '';
      if (status === 'FAILED') break;
    }

    expect(status).toBe('FAILED');
    const finalState = await adapter.getProvisioningJobStatus(runId);
    expect(finalState?.currentStep).toBe('CREATE_TENANT_RECORD');
    expect(finalState?.lastErrorCode).toBe('DATABASE_CREATION_FAILED');
    expect(finalState?.lastErrorMessage).toContain('تعذر إعداد قاعدة البيانات');
  });

  it('supports retry which transitions job back to processing and succeeds', async () => {
    const runId = 'run_worker_failed_retry_success';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة تجربة إعادة التشغيل',
      requestedSubdomain: 'mock-fail-seed', // triggers fail-seed simulation
      ownerName: 'المدير العام',
      ownerEmail: 'fail-seed@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'PENDING' as const,
    };

    // 1. Enqueue job (will fail at SEED_INITIAL_DATA)
    await adapter.enqueueProvisioningJob(payload);

    let status = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await adapter.getProvisioningJobStatus(runId);
      status = state?.status || '';
      if (status === 'FAILED') break;
    }
    expect(status).toBe('FAILED');

    // 2. Modify subdomain in adapter memory directly to bypass simulated fail-seed trigger
    const concreteAdapter = adapter as any;
    if (concreteAdapter.__updateJobState) {
      concreteAdapter.__updateJobState(runId, { subdomain: 'retry-ok-subdomain' });
    }

    // 3. Retry the job
    const retryResult = await adapter.retryProvisioningJob(runId);
    expect(retryResult).toBe(true);

    // 4. Wait for it to process and complete
    status = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await adapter.getProvisioningJobStatus(runId);
      status = state?.status || '';
      if (status === 'READY') break;
    }

    expect(status).toBe('READY');
    const finalState = await adapter.getProvisioningJobStatus(runId);
    expect(finalState?.attemptNo).toBe(2);
    expect(finalState?.completedAt).toBeInstanceOf(Date);
  });
});
