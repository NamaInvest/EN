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
        for (const event of pendingEvents) {
            try {
                // Determine which queue/job handles this eventType
                if (event.eventType === 'ZATCA_REPORT_JOB') {
                    const payload: any = event.payload || {};
                    // We need invoiceHash and invoiceXml, but they might be generated in the worker?
                    // Currently, the syncWorker 'zatca_submit' expects { recordId, invoiceHash, invoiceXml }.
                    // Let's pass the eventId so the worker can fetch it, or just pass payload
                    await syncQueue.add('zatca_submit', {
                        recordId: payload.invoiceId,
                        // Note: If invoiceXml is not in payload, ZATCA worker must generate it
                        // This implies we need a dedicated ZATCA generation worker job, or modify 'zatca_submit'
                        ...payload
                    });
                } else {
                    // Generic EventBus dispatch
                    await syncQueue.add('process_event', {
                        eventId: event.id,
                        eventType: event.eventType,
                        payload: event.payload
                    });
                }

                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: 'PROCESSED', processedAt: new Date(), attempts: { increment: 1 } }
                });
                dispatched++;
            } catch (error: any) {
                logger.error({}, `[OutboxRelayWorker] Error dispatching event ${event.id}: ${error.message}`);
                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: 'FAILED', error: error.message, attempts: { increment: 1 } }
                });
            }
        }

        return { status: 'completed', processed: dispatched };
    },
    { connection: redisConnection, concurrency: 1 }
);
