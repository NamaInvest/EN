import { Worker, Job } from 'bullmq';
import { redisConnection, syncQueue } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const outboxRelayWorker = new Worker(
    'outboxRelayQueue',
    async (job: Job) => {
        logger.info({}, `[OutboxRelayWorker] Processing job ${job.id}`);

        // Fetch up to 100 pending events
        const pendingEvents = await prisma.outboxEvent.findMany({
            where: { status: 'PENDING' },
            take: 100,
            orderBy: { createdAt: 'asc' }
        });

        if (pendingEvents.length === 0) {
            return { status: 'completed', processed: 0 };
        }

        let dispatched = 0;
        const MAX_ATTEMPTS = 5;

        for (const event of pendingEvents) {
            try {
                const currentAttempt = event.attempts + 1;
                logger.info({ tenantId: event.tenantId, eventType: event.eventType, attempts: currentAttempt }, `[OutboxRelayWorker] Dispatching event ${event.id}`);

                const jobId = event.idempotencyKey || `outbox-event-${event.id}`;

                // Determine which queue/job handles this eventType
                if (event.eventType === 'ZATCA_REPORT_JOB') {
                    const payload: any = event.payload || {};
                    await syncQueue.add('zatca_submit', {
                        tenantId: event.tenantId,
                        recordId: payload.invoiceId,
                        // Note: If invoiceXml is not in payload, ZATCA worker must generate it
                        ...payload
                    }, { jobId });
                } else {
                    // Generic EventBus dispatch
                    await syncQueue.add('process_event', {
                        tenantId: event.tenantId,
                        eventId: event.id,
                        eventType: event.eventType,
                        payload: event.payload
                    }, { jobId });
                }

                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: 'PROCESSED', processedAt: new Date(), attempts: { increment: 1 } }
                });
                dispatched++;
            } catch (error: any) {
                const nextAttempt = event.attempts + 1;
                const isFailed = nextAttempt >= MAX_ATTEMPTS;
                const newStatus = isFailed ? 'FAILED' : 'PENDING';

                logger.error({ tenantId: event.tenantId, eventType: event.eventType, attempts: nextAttempt }, `[OutboxRelayWorker] Error dispatching event ${event.id}: ${error.message}. Status -> ${newStatus}`);

                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: newStatus, error: error.message, attempts: { increment: 1 } }
                });
            }
        }

        return { status: 'completed', processed: dispatched };
    },
    { connection: redisConnection, concurrency: 1 }
);
