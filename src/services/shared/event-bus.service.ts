import { BusinessContext } from '../../lib/context/business-context';
export type { BusinessContext };

type EventHandler<T = any> = (payload: T, ctx: BusinessContext) => Promise<void>;

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

  async flush(ctx: BusinessContext) {
    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const { name, payload } of events) {
      // Dummy publish via syncQueue
      console.log(`[EventBus] Pushing ${name} to syncQueue for tenant ${ctx.tenant.id}`);
    }
  }
}

export const eventBus = new EventBus();
