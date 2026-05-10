import { logger } from '@/lib/logger';

const log = logger.child({ service: 'AIJobQueue' });
/**
 * AI-09 — Background AI Job Queue
 * Simple in-process job queue for AI tasks (upgrade to BullMQ + Redis for production).
 */

type JobHandler = (payload: any) => Promise<void>;

interface QueuedJob {
    id: string;
    queue: string;
    payload: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    attempts: number;
    maxAttempts: number;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

const handlers = new Map<string, JobHandler>();
const jobs: QueuedJob[] = [];
let jobCounter = 0;

/**
 * Register a handler for a queue name.
 */
export function registerWorker(queueName: string, handler: JobHandler): void {
    handlers.set(queueName, handler);
}

/**
 * Enqueue a job for background processing.
 */
export function enqueueJob(queueName: string, payload: any, maxAttempts: number = 3): string {
    const id = `job_${++jobCounter}_${Date.now()}`;
    const job: QueuedJob = {
        id,
        queue: queueName,
        payload,
        status: 'pending',
        attempts: 0,
        maxAttempts,
        createdAt: new Date(),
    };
    jobs.push(job);

    // Process async (non-blocking)
    setImmediate(() => processJob(job));

    return id;
}

async function processJob(job: QueuedJob): Promise<void> {
    const handler = handlers.get(job.queue);
    if (!handler) {
        job.status = 'failed';
        job.error = `No handler registered for queue: ${job.queue}`;
        return;
    }

    while (job.attempts < job.maxAttempts && job.status !== 'completed') {
        job.attempts++;
        job.status = 'running';

        try {
            await handler(job.payload);
            job.status = 'completed';
            job.completedAt = new Date();
        } catch (err: any) {
            job.error = err.message;
            if (job.attempts >= job.maxAttempts) {
                job.status = 'failed';
            } else {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, job.attempts - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

/**
 * Get job status by ID.
 */
export function getJobStatus(jobId: string): QueuedJob | undefined {
    return jobs.find(j => j.id === jobId);
}

/**
 * Get all jobs for a queue.
 */
export function getQueueJobs(queueName: string, limit: number = 50): QueuedJob[] {
    return jobs
        .filter(j => j.queue === queueName)
        .slice(-limit)
        .reverse();
}

/**
 * Get queue stats.
 */
export function getQueueStats(): Record<string, { pending: number; running: number; completed: number; failed: number }> {
    const stats: Record<string, any> = {};

    for (const job of jobs) {
        if (!stats[job.queue]) {
            stats[job.queue] = { pending: 0, running: 0, completed: 0, failed: 0 };
        }
        stats[job.queue][job.status]++;
    }

    return stats;
}

// === Pre-register AI workers ===
registerWorker('daily-audit', async (payload) => {
    // Placeholder: will call /api/ai/auditor logic
    log.info('Running daily audit for tenant', { tenantId: payload.tenantId });
});

registerWorker('embed-knowledge', async (payload) => {
    // Placeholder: will call vector-store ingestion
    log.info('Embedding document', { documentId: payload.documentId });
});

registerWorker('ocr-batch', async (payload) => {
    // Placeholder: will process batch OCR
    log.info('Processing OCR batch', { batchId: payload.batchId });
});
