/**
 * EventBus — Publish/Subscribe backed by BullMQ
 *
 * Publishing an event:
 *   1. Logs the event in EventLog (DB audit trail)
 *   2. Enqueues the event into the syncQueue for async processing
 *
 * Consuming events:
 *   Handled by the syncQueue worker in src/lib/queue/index.ts
 *   which dispatches to registered EventHandlers.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type EventPayload = Record<string, any>;

export type EventHandler = (
    eventType: string,
    payload: EventPayload,
    eventId: number
) => Promise<void>;

// ── Handler registry ─────────────────────────────────────────────────────
const handlers = new Map<string, EventHandler[]>();

/**
 * Register a handler for a specific event type.
 * Called at startup (e.g., from instrumentation.ts) to wire up business logic.
 *
 * @example
 *   EventBus.subscribe('INVOICE_CREATED', async (type, payload, id) => {
 *     await sendInvoiceEmail(payload.invoiceId);
 *   });
 */
export class EventBus {
    static subscribe(eventType: string, handler: EventHandler) {
        if (!handlers.has(eventType)) handlers.set(eventType, []);
        handlers.get(eventType)!.push(handler);
        logger.info({}, `EventBus: handler registered for "${eventType}"`);
    }

    /**
     * Publish an event:
     * 1. Persist in EventLog (DB)
     * 2. Enqueue into syncQueue for async consumption
     */
    static async publish(
        eventType: string,
        sourceModule: string,
        payload: EventPayload
    ): Promise<{ success: boolean; eventId?: number; error?: string }> {
        try {
            const log = await prisma.eventLog.create({
                data: { eventType, sourceModule, payload, status: 'PENDING' },
            });

            // Enqueue for async processing
            try {
                const { syncQueue } = await import('@/lib/queue');
                await syncQueue.add('process_event', {
                    eventId: log.id,
                    eventType,
                    payload,
                });
            } catch (qErr: any) {
                // Queue unavailable — dispatch inline (slower but functional)
                logger.warn({ }, 'EventBus: queue unavailable, dispatching inline', { error: qErr.message });
                setImmediate(() => EventBus.dispatch(log.id, eventType, payload));
            }

            return { success: true, eventId: log.id };
        } catch (e: any) {
            logger.error({}, 'EventBus Publish Error', { error: e.message });
            return { success: false, error: e.message };
        }
    }

    /**
     * Dispatch an event to all registered handlers.
     * Called by the syncQueue worker.
     */
    static async dispatch(eventId: number, eventType: string, payload: EventPayload): Promise<void> {
        const eventHandlers = handlers.get(eventType) ?? [];

        if (eventHandlers.length === 0) {
            logger.info({}, `EventBus: no handlers for "${eventType}" — marking processed`);
            await EventBus.markProcessed(eventId);
            return;
        }

        try {
            await Promise.all(eventHandlers.map(h => h(eventType, payload, eventId)));
            await EventBus.markProcessed(eventId);
        } catch (err: any) {
            logger.error({}, `EventBus: dispatch failed for "${eventType}"`, { error: err.message });
            await EventBus.markFailed(eventId, err.message);
            throw err; // Re-throw so BullMQ can retry
        }
    }

    static async markProcessed(eventId: number) {
        return prisma.eventLog.update({
            where: { id: eventId },
            data: { status: 'PROCESSED', processedAt: new Date() },
        });
    }

    static async markFailed(eventId: number, reason: string) {
        return prisma.eventLog.update({
            where: { id: eventId },
            data: { status: 'FAILED', errorReason: reason },
        });
    }

    /** Replay all PENDING or FAILED events (for recovery after downtime). */
    static async replayPending(limit = 50): Promise<number> {
        const events = await prisma.eventLog.findMany({
            where: { status: { in: ['PENDING', 'FAILED'] } },
            orderBy: { id: 'asc' },
            take: limit,
        });

        for (const ev of events) {
            await EventBus.dispatch(ev.id, ev.eventType, ev.payload as EventPayload);
        }

        return events.length;
    }
}
