/**
 * Business Context used across the Service Layer.
 */
export interface BusinessContext {
  tenant: {
    id: string;
    name?: string;
  };
  user: {
    id: string;
    role?: string;
  };
  branch?: {
    id: string;
  };
  fiscal?: {
    isClosed: boolean;
  };
  requirePermission: (permission: string) => void;
}

type EventHandler<T = any> = (payload: T, ctx: BusinessContext) => Promise<void>;

/**
 * Domain Event Bus for decoupled service communication.
 */
export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private pendingEvents: { name: string; payload: any }[] = [];

  on<T>(eventName: string, handler: EventHandler<T>) {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  // Publish immediately (use with caution inside transactions)
  async publish(eventName: string, payload: any, ctx: BusinessContext) {
    const handlers = this.handlers.get(eventName) || [];
    await Promise.allSettled(handlers.map(h => h(payload, ctx)));
  }

  // Queue event to be published after transaction commits
  afterCommit(eventName: string, payload: any) {
    this.pendingEvents.push({ name: eventName, payload });
  }

  // Flushes pending events (usually called after a successful transaction)
  async flush(ctx: BusinessContext) {
    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const { name, payload } of events) {
      // Typically, publish via BullMQ for reliability
      // Example: await syncQueue.add('domain-event', { name, payload, tenantId: ctx.tenant.id });
      // For now, we publish them synchronously
      await this.publish(name, payload, ctx);
    }
  }
}

// Global instance for the application
export const eventBus = new EventBus();
