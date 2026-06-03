import { ProvisioningPayload, ProvisioningJobState, ProvisioningRunStatus, ProvisioningJobStep } from './provisioning-job-types';
import { logger } from '@/lib/logger';
import { isQueueEnabled as getIsQueueEnabled } from './provisioning-guard';

const log = logger.child({ service: 'tenant/provisioning-queue' });

// Global Feature Flag configuration check
export function isQueueEnabled(): boolean {
  return getIsQueueEnabled();
}

export interface ProvisioningQueueAdapter {
  enqueueProvisioningJob(payload: ProvisioningPayload): Promise<ProvisioningJobState>;
  getProvisioningJobStatus(runId: string): Promise<ProvisioningJobState | null>;
  retryProvisioningJob(runId: string): Promise<boolean>;
  cancelProvisioningJob(runId: string): Promise<boolean>;
  listProvisioningJobs(): Promise<ProvisioningJobState[]>;
  getProvisioningTimeline(runId: string): Promise<{ step: ProvisioningJobStep; status: string; timestamp: Date }[]>;
}

// In-Memory/No-Op Adapter for Local Testing
export class InMemoryProvisioningQueueAdapter implements ProvisioningQueueAdapter {
  private jobs = new Map<string, { payload: ProvisioningPayload; state: ProvisioningJobState }>();
  private timelines = new Map<string, { step: ProvisioningJobStep; status: string; timestamp: Date }[]>();

  async enqueueProvisioningJob(payload: ProvisioningPayload): Promise<ProvisioningJobState> {
    const runId = payload.provisioningRunId;
    const state: ProvisioningJobState = {
      runId,
      subdomain: payload.requestedSubdomain,
      status: 'PENDING',
      currentStep: null,
      attemptNo: 1,
      lastErrorCode: null,
      lastErrorMessage: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
    };

    this.jobs.set(runId, { payload, state });
    this.timelines.set(runId, [
      { step: 'VALIDATE_REQUEST', status: 'PENDING', timestamp: new Date() }
    ]);

    log.info(`[InMemoryQueue] Enqueued job ${runId} for subdomain ${payload.requestedSubdomain}`);
    return state;
  }

  async getProvisioningJobStatus(runId: string): Promise<ProvisioningJobState | null> {
    const job = this.jobs.get(runId);
    return job ? { ...job.state } : null;
  }

  async retryProvisioningJob(runId: string): Promise<boolean> {
    const job = this.jobs.get(runId);
    if (!job) return false;

    if (job.state.status !== 'FAILED' && job.state.status !== 'NEEDS_MANUAL_REVIEW') {
      return false;
    }

    job.state.status = 'RETRYING';
    job.state.attemptNo += 1;
    job.state.lastErrorCode = null;
    job.state.lastErrorMessage = null;
    job.state.failedAt = null;

    const timeline = this.timelines.get(runId) || [];
    timeline.push({ step: 'VALIDATE_REQUEST', status: 'RETRYING', timestamp: new Date() });
    this.timelines.set(runId, timeline);

    log.info(`[InMemoryQueue] Retrying job ${runId}, attempt ${job.state.attemptNo}`);
    return true;
  }

  async cancelProvisioningJob(runId: string): Promise<boolean> {
    const job = this.jobs.get(runId);
    if (!job) return false;

    job.state.status = 'CANCELLED';
    job.state.completedAt = null;
    job.state.failedAt = new Date();

    const timeline = this.timelines.get(runId) || [];
    timeline.push({ step: 'MARK_READY', status: 'CANCELLED', timestamp: new Date() });
    this.timelines.set(runId, timeline);

    log.info(`[InMemoryQueue] Cancelled job ${runId}`);
    return true;
  }

  async listProvisioningJobs(): Promise<ProvisioningJobState[]> {
    return Array.from(this.jobs.values()).map(j => ({ ...j.state }));
  }

  async getProvisioningTimeline(runId: string): Promise<{ step: ProvisioningJobStep; status: string; timestamp: Date }[]> {
    return this.timelines.get(runId) || [];
  }

  // Helper method for unit testing state transitions
  __updateJobState(runId: string, updates: Partial<ProvisioningJobState>, steps?: { step: ProvisioningJobStep; status: string }[]) {
    const job = this.jobs.get(runId);
    if (job) {
      job.state = { ...job.state, ...updates };
      if (steps) {
        const timeline = this.timelines.get(runId) || [];
        for (const s of steps) {
          timeline.push({ ...s, timestamp: new Date() });
        }
        this.timelines.set(runId, timeline);
      }
    }
  }
}

// Singleton instances for queue adapters
export function getProvisioningQueueAdapter(): ProvisioningQueueAdapter {
  const globalRef = global as any;
  if (!globalRef.__inMemoryProvisioningQueueInstance) {
    globalRef.__inMemoryProvisioningQueueInstance = new InMemoryProvisioningQueueAdapter();
  }
  return globalRef.__inMemoryProvisioningQueueInstance;
}
