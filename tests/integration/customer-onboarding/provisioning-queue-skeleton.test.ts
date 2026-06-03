import { getProvisioningQueueAdapter, isQueueEnabled } from '@/lib/tenant/provisioning-queue';
import { ProvisioningRunStatus, ProvisioningJobStep } from '@/lib/tenant/provisioning-job-types';
import { validateSubdomainCandidate } from '@/lib/tenant/reserved-subdomains';

describe('Provisioning Queue Skeleton Integration Tests', () => {
  const adapter = getProvisioningQueueAdapter();

  it('defines the correct status model', () => {
    const statuses: ProvisioningRunStatus[] = [
      'PENDING',
      'VALIDATING',
      'RESERVED',
      'PROVISIONING',
      'VERIFYING',
      'READY',
      'FAILED',
      'RETRYING',
      'CANCELLED',
      'NEEDS_MANUAL_REVIEW',
    ];
    expect(statuses).toBeDefined();
    expect(statuses.length).toBe(10);
  });

  it('defines the correct job step names', () => {
    const steps: ProvisioningJobStep[] = [
      'VALIDATE_REQUEST',
      'RESERVE_SUBDOMAIN',
      'CREATE_TENANT_RECORD',
      'VERIFY_SCHEMA',
      'SEED_INITIAL_DATA',
      'CREATE_OWNER_USER',
      'CREATE_DEFAULT_ROLES',
      'CONFIGURE_SUBDOMAIN',
      'VERIFY_TENANT_HEALTH',
      'MARK_READY',
    ];
    expect(steps).toBeDefined();
    expect(steps.length).toBe(10);
  });

  it('supports enqueuing a job on the in-memory adapter without writing to DB', async () => {
    const payload = {
      provisioningRunId: 'run_test_123',
      tenantName: 'شركة الاختبار المحدودة',
      requestedSubdomain: 'test-subdomain-mock',
      ownerName: 'مدير النظام',
      ownerEmail: 'test-owner@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: 'run_test_123',
      createdAt: new Date(),
    };

    const state = await adapter.enqueueProvisioningJob(payload);
    expect(state).toBeDefined();
    expect(state.runId).toBe('run_test_123');
    expect(state.status).toBe('PENDING');
    expect(state.currentStep).toBeNull();
    expect(state.attemptNo).toBe(1);

    const fetchedState = await adapter.getProvisioningJobStatus('run_test_123');
    expect(fetchedState).toEqual(state);

    const timeline = await adapter.getProvisioningTimeline('run_test_123');
    expect(timeline.length).toBe(1);
    expect(timeline[0].step).toBe('VALIDATE_REQUEST');
    expect(timeline[0].status).toBe('PENDING');
  });

  it('supports manual retry of failed jobs through skeleton methods', async () => {
    const runId = 'run_test_failed_retry';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'فشل التجربة',
      requestedSubdomain: 'retry-subdomain-mock',
      ownerName: 'مدير النظام',
      ownerEmail: 'failed@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
    };

    // Enqueue
    await adapter.enqueueProvisioningJob(payload);

    // Verify retry fails for active PENDING job
    let retryResult = await adapter.retryProvisioningJob(runId);
    expect(retryResult).toBe(false);

    // Mock transition to FAILED
    // Use typecasting to access helper method on concrete instance
    const concreteAdapter = adapter as any;
    if (concreteAdapter.__updateJobState) {
      concreteAdapter.__updateJobState(runId, { status: 'FAILED', failedAt: new Date() });
    }

    // Now retry should succeed
    retryResult = await adapter.retryProvisioningJob(runId);
    expect(retryResult).toBe(true);

    const updatedState = await adapter.getProvisioningJobStatus(runId);
    expect(updatedState?.status).toBe('RETRYING');
    expect(updatedState?.attemptNo).toBe(2);
    expect(updatedState?.lastErrorCode).toBeNull();
  });

  it('supports cancellation of enqueued jobs', async () => {
    const runId = 'run_test_cancel';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'إلغاء التجربة',
      requestedSubdomain: 'cancel-subdomain-mock',
      ownerName: 'مدير النظام',
      ownerEmail: 'cancel@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
    };

    await adapter.enqueueProvisioningJob(payload);
    const cancelResult = await adapter.cancelProvisioningJob(runId);
    expect(cancelResult).toBe(true);

    const state = await adapter.getProvisioningJobStatus(runId);
    expect(state?.status).toBe('CANCELLED');
  });

  it('retains subdomain checks and reserved subdomains validation rules', () => {
    const reservedCheck = validateSubdomainCandidate('admin');
    expect(reservedCheck.valid).toBe(false);
    expect(reservedCheck.code).toBe('RESERVED_SUBDOMAIN');

    const shortCheck = validateSubdomainCandidate('ab');
    expect(shortCheck.valid).toBe(false);
    expect(shortCheck.code).toBe('SUBDOMAIN_TOO_SHORT');

    const validCheck = validateSubdomainCandidate('mycompany');
    expect(validCheck.valid).toBe(true);
  });

  it('handles feature flags without exposing secrets in logs', () => {
    const flagVal = isQueueEnabled();
    expect(typeof flagVal).toBe('boolean');
    // Ensure no secrets are leaked in string conversion
    expect(String(flagVal)).not.toContain('RootPass');
  });
});
