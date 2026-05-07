/**
 * BullMQ Queue Definitions + Worker Initialization
 *
 * Queues:
 *  - emailQueue   : Transactional emails
 *  - pdfQueue     : PDF document generation
 *  - syncQueue    : EventBus dispatch + ZATCA/external sync
 *  - reportQueue  : Heavy scheduled report generation
 *
 * Started via instrumentation.ts → startWorkers()
 */
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/logger';

// ── Shared Redis connection ───────────────────────────────────────────────
export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableOfflineQueue: false,
    lazyConnect: true,
});

redisConnection.on('error', (err) => {
    logger.error({}, '[Redis] Connection error', { message: err.message });
});

const defaultJobOptions = {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
};

// ── Queue exports (import these to enqueue jobs from API routes) ──────────
export const emailQueue  = new Queue('emailQueue',  { connection: redisConnection, defaultJobOptions });
export const pdfQueue    = new Queue('pdfQueue',    { connection: redisConnection, defaultJobOptions });
export const syncQueue   = new Queue('syncQueue',   { connection: redisConnection, defaultJobOptions });
export const reportQueue = new Queue('reportQueue', { connection: redisConnection, defaultJobOptions });

// Suppress unhandled errors on queue objects themselves
[emailQueue, pdfQueue, syncQueue, reportQueue].forEach(q => q.on('error', () => {}));

// ── Worker initialization ────────────────────────────────────────────────
export const startWorkers = () => {

    // ── Email Worker ──────────────────────────────────────────────────────
    const emailWorker = new Worker('emailQueue', async job => {
        const { to, subject, html, text } = job.data;
        logger.info({}, `[emailQueue] Processing job ${job.id}`, { to });
        const { sendEmail } = await import('@/lib/email');
        const success = await sendEmail({ to, subject, html, text });
        if (!success) throw new Error(`Failed to send email to ${to}`);
        return { status: 'sent', to };
    }, { connection: redisConnection, concurrency: 5 });

    // ── PDF Worker ────────────────────────────────────────────────────────
    const pdfWorker = new Worker('pdfQueue', async job => {
        const { documentType, documentId, tenantId } = job.data;
        logger.info({ tenantId }, `[pdfQueue] Processing job ${job.id}`, { documentType, documentId });

        try {
            const { CustomerStatementPdfEngine } = await import('@/lib/customer-statement-pdf');
            const { uploadFile } = await import('@/lib/cloud-storage');

            const dateFrom = job.data.dateFrom ? new Date(job.data.dateFrom) : new Date(Date.now() - 30 * 86400000);
            const dateTo   = job.data.dateTo   ? new Date(job.data.dateTo)   : new Date();

            const { pdfBuffer } = await CustomerStatementPdfEngine.generatePdf(documentId, dateFrom, dateTo);
            const result = await uploadFile(pdfBuffer, `${documentType}-${documentId}.pdf`, 'documents');
            return { status: 'generated', url: result.url };
        } catch (err: any) {
            // Fallback for non-statement PDF types
            logger.warn({ tenantId }, `[pdfQueue] PDF generation not implemented for type ${documentType}`);
            return { status: 'skipped', reason: 'handler_not_implemented' };
        }
    }, { connection: redisConnection, concurrency: 2 });

    // ── Sync Worker (EventBus dispatcher) ────────────────────────────────
    const syncWorker = new Worker('syncQueue', async job => {
        logger.info({}, `[syncQueue] Processing job ${job.id}`, { name: job.name });

        if (job.name === 'process_event') {
            const { eventId, eventType, payload } = job.data;
            const { EventBus } = await import('@/lib/event-bus');
            await EventBus.dispatch(eventId, eventType, payload);
            return { status: 'dispatched', eventType };
        }

        if (job.name === 'zatca_submit') {
            const { recordId, invoiceHash, invoiceXml } = job.data;
            const { reportInvoice } = await import('@/lib/zatca-fatoora');
            const bst    = process.env.ZATCA_BINARY_SECURITY_TOKEN;
            const secret = process.env.ZATCA_SECRET;
            if (!bst || !secret) throw new Error('ZATCA credentials not configured');

            const response = await reportInvoice({
                binarySecurityToken: bst,
                secret,
                invoiceHash,
                uuid: recordId.toString(),
                invoiceBase64: Buffer.from(invoiceXml || '').toString('base64'),
                environment: (process.env.ZATCA_ENV || 'simulation') as 'simulation' | 'production',
            });

            const passed = response.status === 'PASS' || response.status === 'WARNING';
            return { status: passed ? 'submitted' : 'failed', zatcaStatus: response.status };
        }

        return { status: 'unknown_job' };
    }, { connection: redisConnection, concurrency: 3 });

    // ── Report Worker ─────────────────────────────────────────────────────
    const reportWorker = new Worker('reportQueue', async job => {
        const { reportType, tenantId, params } = job.data;
        logger.info({ tenantId }, `[reportQueue] Processing job ${job.id}`, { reportType });

        try {
            const { CustomReportEngine } = await import('@/lib/custom-report-engine');
            const result = await (CustomReportEngine as any).generate(reportType, tenantId, params);
            return { status: 'generated', result };
        } catch (err: any) {
            logger.warn({ tenantId }, `[reportQueue] handler not available for ${reportType}`);
            return { status: 'skipped' };
        }
    }, { connection: redisConnection, concurrency: 2 });

    // ── Global event handlers ─────────────────────────────────────────────
    const allWorkers = [emailWorker, pdfWorker, syncWorker, reportWorker];

    allWorkers.forEach(worker => {
        worker.on('error',     err  => logger.error({}, `[Queue] ${worker.name} error`, { message: err.message }));
        worker.on('failed',    (job, err) => logger.error({}, `[Queue] ${worker.name} job ${job?.id} failed`, { error: err.message }));
        worker.on('completed', job  => logger.info({},  `[Queue] ${worker.name} job ${job?.id} completed`));
    });

    logger.info({}, '[Queue] Workers started', { queues: ['email', 'pdf', 'sync', 'report'] });

    return allWorkers;
};
