import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Reuse existing Redis URL or fallback
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null, // Required by bullmq
});

const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
};

// --- Queues ---
export const emailQueue = new Queue('emailQueue', { connection: redisConnection, defaultJobOptions });
export const pdfQueue = new Queue('pdfQueue', { connection: redisConnection, defaultJobOptions });
export const syncQueue = new Queue('syncQueue', { connection: redisConnection, defaultJobOptions });
export const reportQueue = new Queue('reportQueue', { connection: redisConnection, defaultJobOptions });

[emailQueue, pdfQueue, syncQueue, reportQueue].forEach(queue => {
    queue.on('error', (err) => {
        // Suppress default printing of queue errors to avoid log bloat when Redis is offline
    });
});

// --- Workers ---
// In a Next.js app, workers are typically run in a custom server or external process,
// but for this MVP, we can define them here to be initialized on startup.
export const startWorkers = () => {
    const emailWorker = new Worker('emailQueue', async job => {
        console.log(`Processing email job ${job.id}`);
        const { sendEmail } = require('@/lib/email');
        const { to, subject, html, text } = job.data;
        const success = await sendEmail({ to, subject, html, text });
        if (!success) throw new Error('Failed to send email');
        return { status: 'sent', to };
    }, { connection: redisConnection });

    const pdfWorker = new Worker('pdfQueue', async job => {
        console.log(`Processing pdf job ${job.id}`);
        // Handle pdf generation
        const { documentType, documentId } = job.data;
        // mock logic
        return { status: 'generated', url: `/downloads/${documentType}-${documentId}.pdf` };
    }, { connection: redisConnection });

    const syncWorker = new Worker('syncQueue', async job => {
        console.log(`Processing sync job ${job.id}`);
        // Handle external sync (ZATCA, etc)
        return { status: 'synced' };
    }, { connection: redisConnection });

    const reportWorker = new Worker('reportQueue', async job => {
        console.log(`Processing report job ${job.id}`);
        // Handle heavy report generation
        return { status: 'generated' };
    }, { connection: redisConnection });

    // Global Error Handling
    redisConnection.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
    });

    [emailWorker, pdfWorker, syncWorker, reportWorker].forEach(worker => {
        worker.on('error', (err) => {
            console.error(`[Queue] ${worker.name} encountered an error:`, err.message);
        });
        worker.on('failed', (job, err) => {
            console.error(`${worker.name} Job ${job?.id} failed:`, err);
        });
        worker.on('completed', job => {
            console.log(`${worker.name} Job ${job?.id} completed.`);
        });
    });

    console.log('[Queue] Workers started for Email, PDF, Sync, and Reports.');
};
