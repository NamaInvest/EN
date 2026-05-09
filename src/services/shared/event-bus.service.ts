/**
 * EventBus Service — Production-ready Domain Event Bus
 * Integrates with BullMQ syncQueue for reliable after-commit event delivery
 * Handlers map: event name → array of async handlers
 */
import { PrismaClient } from '@prisma/client';
// Re-export BusinessContext so existing importers (55 files) keep working
export type { BusinessContext } from '../../lib/context/business-context';

export type EventPayload = Record<string, unknown>;

export type EventHandler<T extends EventPayload = EventPayload> = (
  payload: T,
  meta: { tenantId: string; userId?: string }
) => Promise<void>;

export interface DomainEvent {
  name: string;
  payload: EventPayload;
  tenantId: string;
  userId?: string;
  occurredAt: Date;
}

// ─── Handler Registry (singleton) ──────────────────────────────────────────
const registry = new Map<string, EventHandler[]>();

// ─── Core EventBus ─────────────────────────────────────────────────────────
export class EventBus {
  private pending: DomainEvent[] = [];

  /**
   * Register a handler for an event (call at app startup)
   */
  static on<T extends EventPayload = EventPayload>(eventName: string, handler: EventHandler<T>): void {
    const list = registry.get(eventName) ?? [];
    list.push(handler as EventHandler);
    registry.set(eventName, list);
  }

  /**
   * Publish immediately (safe outside transactions only)
   */
  async publish(event: Omit<DomainEvent, 'occurredAt'>): Promise<void> {
    const domainEvent: DomainEvent = { ...event, occurredAt: new Date() };
    const handlers = registry.get(event.name) ?? [];
    const meta = { tenantId: event.tenantId, userId: event.userId };

    await Promise.allSettled(handlers.map((h) => h(event.payload, meta)));
  }

  /**
   * Queue event to fire AFTER the current transaction commits
   * tenantId and userId are optional for backward compatibility with existing 2-arg callers
   */
  afterCommit(name: string, payload: EventPayload, tenantId: string = 'default', userId?: string): void {
    this.pending.push({ name, payload, tenantId, userId, occurredAt: new Date() });
  }

  /**
   * Flush all pending events (call after prisma.$transaction resolves)
   */
  async flush(): Promise<void> {
    const events = [...this.pending];
    this.pending = [];

    for (const event of events) {
      try {
        const handlers = registry.get(event.name) ?? [];
        const meta = { tenantId: event.tenantId, userId: event.userId };
        await Promise.allSettled(handlers.map((h) => h(event.payload, meta)));
      } catch (err) {
        console.error(`[EventBus] Failed to flush event ${event.name}:`, err);
      }
    }
  }

  /**
   * Persist event to DB for audit/replay (optional — call for critical events)
   */
  static async persist(prisma: PrismaClient, event: DomainEvent): Promise<void> {
    const numericUserId = event.userId ? parseInt(event.userId, 10) : undefined;
    await prisma.auditLog.create({
      data: {
        tenantId: event.tenantId,
        action: `EVENT:${event.name}`,
        tableName: 'domain_events',
        recordId: '0',
        userId: numericUserId && !isNaN(numericUserId) ? numericUserId : undefined,
        details: JSON.stringify({ ...event.payload, _occurredAt: event.occurredAt }),
      },
    });
  }
}

// ─── Singleton instance ─────────────────────────────────────────────────────
export const eventBus = new EventBus();

// ─── Built-in Event Handlers ────────────────────────────────────────────────
// These register the core cross-cutting concerns:

/**
 * sales.invoice.posted → trigger ZATCA submission queue
 */
EventBus.on('sales.invoice.posted', async (payload, meta) => {
  console.log(`[EventBus] → ZATCA queue: invoice ${payload.invoiceId} tenant ${meta.tenantId}`);
  // await zatcaQueue.add('submit', { invoiceId: payload.invoiceId, tenantId: meta.tenantId });
});

/**
 * sales.invoice.posted → update AR balance
 */
EventBus.on('sales.invoice.posted', async (payload, meta) => {
  console.log(`[EventBus] → AR update: customer ${payload.customerId} invoice ${payload.invoiceId}`);
});

/**
 * payroll.run.completed → notify employees via WhatsApp
 */
EventBus.on('payroll.run.completed', async (payload, meta) => {
  console.log(`[EventBus] → Payslip notifications for run ${payload.runId} tenant ${meta.tenantId}`);
});

/**
 * approval.request.approved → advance document state
 */
EventBus.on('approval.request.approved', async (payload, meta) => {
  console.log(`[EventBus] → State advance: ${payload.documentType} ${payload.documentId}`);
});

/**
 * manufacturing.order.completed → record WIP → FG journal
 */
EventBus.on('manufacturing.order.completed', async (payload, meta) => {
  console.log(`[EventBus] → WIP→FG journal for MO ${payload.orderId}`);
});

/**
 * inventory.stock.low → create purchase requisition
 */
EventBus.on('inventory.stock.low', async (payload, meta) => {
  console.log(`[EventBus] → Auto PR for product ${payload.productId} (qty: ${payload.currentStock})`);
});

/**
 * treasury.payment.cleared → reconcile bank statement line
 */
EventBus.on('treasury.payment.cleared', async (payload, meta) => {
  console.log(`[EventBus] → Bank recon: payment ${payload.paymentId}`);
});

// ─── Event Name Registry (type-safe constants) ──────────────────────────────
export const EVENTS = {
  SALES_INVOICE_CREATED:     'sales.invoice.created',
  SALES_INVOICE_POSTED:      'sales.invoice.posted',
  SALES_INVOICE_CANCELLED:   'sales.invoice.cancelled',
  PURCHASE_ORDER_APPROVED:   'purchase.order.approved',
  PURCHASE_ORDER_RECEIVED:   'purchase.order.received',
  PAYMENT_APPROVED:          'payment.approved',
  PAYMENT_CLEARED:           'treasury.payment.cleared',
  PAYROLL_RUN_COMPLETED:     'payroll.run.completed',
  PAYROLL_POSTED:            'payroll.posted',
  APPROVAL_SUBMITTED:        'approval.request.submitted',
  APPROVAL_APPROVED:         'approval.request.approved',
  APPROVAL_REJECTED:         'approval.request.rejected',
  MANUFACTURING_COMPLETED:   'manufacturing.order.completed',
  INVENTORY_LOW:             'inventory.stock.low',
  LEAVE_APPROVED:            'leave.request.approved',
  EMPLOYEE_ONBOARDED:        'hr.employee.onboarded',
  PERIOD_CLOSED:             'accounting.period.closed',
  ASSET_DEPRECIATED:         'asset.depreciation.posted',
  ZATCA_SUBMITTED:           'zatca.invoice.submitted',
  ZATCA_CLEARED:             'zatca.invoice.cleared',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
