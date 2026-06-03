/**
 * Next.js Instrumentation Hook
 * Runs before the server starts — used to:
 * 1. Initialize tenant AsyncLocalStorage context
 * 2. Start BullMQ background workers
 * 3. Register EventBus handlers (business logic subscribers)
 * 4. Wire onRequestError to structured logger
 */
import { logger } from './src/lib/logger';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // ── 0. OpenTelemetry ─────────────────────────────────────────────
        await import('./src/lib/instrumentation/otel');

        // ── 1. Tenant Context ────────────────────────────────────────────
        await import('./src/lib/prisma');
        logger.info({}, '[Instrumentation] Tenant context initialized');

        // ── 2. BullMQ Workers ────────────────────────────────────────────
        try {
            const { startWorkers } = await import('./src/lib/queue');
            startWorkers();
            logger.info({}, '[Instrumentation] BullMQ workers started (email, pdf, sync, report)');
        } catch (error: any) {
            logger.error({}, '[Instrumentation] Failed to start BullMQ workers', { error: error.message });
        }

        // ── 2.5 Onboarding Background Worker ────────────────────────────
        try {
            const { startProvisioningWorker } = await import('./src/lib/tenant/provisioning-worker');
            startProvisioningWorker();
            logger.info({}, '[Instrumentation] Onboarding background worker initialized');
        } catch (error: any) {
            logger.error({}, '[Instrumentation] Failed to start onboarding worker', { error: error.message });
        }

        // ── 3. EventBus Handlers ─────────────────────────────────────────
        try {
            const { EventBus } = await import('./src/lib/event-bus');

            // Handler: Invoice Created → send email + enqueue ZATCA submission
            EventBus.subscribe('INVOICE_CREATED', async (_type, payload) => {
                const { emailQueue, syncQueue } = await import('./src/lib/queue');
                // Notify customer
                if (payload.customerEmail) {
                    await emailQueue.add('invoice_notification', {
                        to:      payload.customerEmail,
                        subject: `فاتورة رقم ${payload.invoiceNo}`,
                        html:    `<p>تم إصدار فاتورتك رقم ${payload.invoiceNo} بمبلغ ${payload.total}</p>`,
                    });
                }
                // Submit to ZATCA if hash available
                if (payload.zatcaHash && payload.zatcaXml) {
                    await syncQueue.add('zatca_submit', {
                        recordId:    payload.invoiceId,
                        invoiceHash: payload.zatcaHash,
                        invoiceXml:  payload.zatcaXml,
                    });
                }
            });

            // Handler: Payment Received → update ledger + notify
            EventBus.subscribe('PAYMENT_RECEIVED', async (_type, payload) => {
                logger.info({ tenantId: payload.tenantId }, 'EventBus: payment received', {
                    amount: payload.amount, customerId: payload.customerId,
                });
                // Future: trigger reconciliation job
            });

            // Handler: Low Stock → alert purchasing team
            EventBus.subscribe('LOW_STOCK_ALERT', async (_type, payload) => {
                const { emailQueue } = await import('./src/lib/queue');
                const purchasingEmail = process.env.PURCHASING_ALERT_EMAIL;
                if (purchasingEmail) {
                    await emailQueue.add('low_stock_alert', {
                        to:      purchasingEmail,
                        subject: `تنبيه: مخزون منخفض — ${payload.productName}`,
                        html:    `<p>المنتج "${payload.productName}" وصل لحد الإعادة (${payload.currentStock} وحدة)</p>`,
                    });
                }
            });

            // Handler: Replay any PENDING events from before server restart
            const replayed = await EventBus.replayPending(20);
            if (replayed > 0) {
                logger.info({}, `[Instrumentation] Replayed ${replayed} pending events`);
            }

            logger.info({}, '[Instrumentation] EventBus handlers registered (INVOICE_CREATED, PAYMENT_RECEIVED, LOW_STOCK_ALERT)');
        } catch (error: any) {
            logger.error({}, '[Instrumentation] Failed to register EventBus handlers', { error: error.message });
        }
    }
}

/**
 * onRequestError — structured logging for all unhandled route errors
 */
export async function onRequestError(
    err: unknown,
    request: { path: string; headers: Record<string, string> },
    context: { routerKind: string; routeType: string }
) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
        { route: request.path },
        `[onRequestError] Unhandled error in ${context.routerKind}/${context.routeType}`,
        { error: message }
    );
}
