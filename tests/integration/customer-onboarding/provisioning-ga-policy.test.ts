import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';
import { startProvisioningWorker, stopProvisioningWorker } from '@/lib/tenant/provisioning-worker';
import { validateInviteCode } from '@/lib/tenant/provisioning-guard';

describe('General Availability Policy Integration Tests', () => {
  const adapter = getProvisioningQueueAdapter();
  let originalWorkerEnabled: string | undefined;

  beforeAll(() => {
    originalWorkerEnabled = process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED;
    process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = 'true';
    startProvisioningWorker();
  });

  afterAll(() => {
    stopProvisioningWorker();
    if (originalWorkerEnabled === undefined) {
      delete process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED;
    } else {
      process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED = originalWorkerEnabled;
    }
    vi.unstubAllEnvs();
  });

  it('validates invite codes correctly based on env vars', () => {
    vi.stubEnv('ONBOARDING_INVITE_CODES', 'CODE1,CODE2');
    expect(validateInviteCode('CODE1')).toBe(true);
    expect(validateInviteCode('CODE2')).toBe(true);
    expect(validateInviteCode('INVALID')).toBe(false);
    expect(validateInviteCode('')).toBe(false);
  });

  it('keeps invite code validated with fallback codes when env is empty', () => {
    vi.stubEnv('ONBOARDING_INVITE_CODES', '');
    expect(validateInviteCode('NAMA-GA-2026')).toBe(true);
    expect(validateInviteCode('NAMA-GA-PROD-2026')).toBe(true);
    expect(validateInviteCode('INVALID')).toBe(false);
  });

  it('does NOT process job that is in AWAITING_APPROVAL status', async () => {
    const runId = 'run_ga_awaiting_approval';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة الانتظار المحدودة',
      requestedSubdomain: 'awaiting-approval-subdomain',
      ownerName: 'المدير العام',
      ownerEmail: 'awaiting@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'AWAITING_APPROVAL' as const,
    };

    await adapter.enqueueProvisioningJob(payload);

    // Wait a bit to ensure worker loop had a chance to run
    await new Promise(resolve => setTimeout(resolve, 300));

    const state = await adapter.getProvisioningJobStatus(runId);
    expect(state?.status).toBe('AWAITING_APPROVAL'); // Should remain AWAITING_APPROVAL
  });

  it('processes job and marks it READY after transition to PENDING', async () => {
    const runId = 'run_ga_approved_success';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة الموافقة المحدودة',
      requestedSubdomain: 'approved-subdomain',
      ownerName: 'المدير العام',
      ownerEmail: 'approved@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'AWAITING_APPROVAL' as const,
    };

    await adapter.enqueueProvisioningJob(payload);

    // Confirm it starts as AWAITING_APPROVAL and is not processed
    let state = await adapter.getProvisioningJobStatus(runId);
    expect(state?.status).toBe('AWAITING_APPROVAL');

    // Simulate Admin Approval by transitioning to PENDING
    const concreteAdapter = adapter as any;
    if (concreteAdapter.__updateJobState) {
      concreteAdapter.__updateJobState(runId, { status: 'PENDING' });
    }

    // Wait and verify it changes to READY
    let status = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const s = await adapter.getProvisioningJobStatus(runId);
      status = s?.status || '';
      if (status === 'READY') break;
    }

    expect(status).toBe('READY');
  });

  it('keeps job in REJECTED status and does NOT process it', async () => {
    const runId = 'run_ga_rejected';
    const payload = {
      provisioningRunId: runId,
      tenantName: 'شركة المرفوضين المحدودة',
      requestedSubdomain: 'rejected-subdomain',
      ownerName: 'المدير العام',
      ownerEmail: 'rejected@namasoft.com',
      locale: 'ar',
      source: 'WEB_APP',
      correlationId: runId,
      createdAt: new Date(),
      initialStatus: 'AWAITING_APPROVAL' as const,
    };

    await adapter.enqueueProvisioningJob(payload);

    // Simulate Admin Rejection by transitioning to REJECTED
    const concreteAdapter = adapter as any;
    if (concreteAdapter.__updateJobState) {
      concreteAdapter.__updateJobState(runId, { status: 'REJECTED' });
    }

    // Wait and confirm status remains REJECTED
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = await adapter.getProvisioningJobStatus(runId);
    expect(state?.status).toBe('REJECTED');
  });
});
