/**
 * Webhooks Manager
 * ──────────────────────────────────────────────────────────
 * Outbound webhook system for notifying external systems of ERP events.
 * Supports: invoice.created, payment.received, inventory.low, etc.
 *
 * Features:
 * - Event subscription management
 * - Automatic retry with exponential backoff
 * - HMAC signature verification
 * - Delivery logging
 *
 * Usage:
 *   import { webhooks } from '@/lib/webhooks';
 *   await webhooks.emit('invoice.created', { invoiceId: 123, total: 5000 });
 */

import { logger } from '@/lib/logger';
import crypto from 'crypto';

const log = logger.child({ route: 'Webhooks' });

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface DeliveryLog {
  subscriptionId: string;
  event: string;
  status: number;
  duration: number;
  attempt: number;
  timestamp: Date;
}

// In-memory store (migrate to DB for production persistence)
const subscriptions = new Map<string, WebhookSubscription>();
const deliveryLogs: DeliveryLog[] = [];
const MAX_LOGS = 1000;
const MAX_RETRIES = 3;

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export const webhooks = {
  /** Register a new webhook subscription */
  subscribe(url: string, events: string[], secret?: string): WebhookSubscription {
    const sub: WebhookSubscription = {
      id: generateId(),
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      createdAt: new Date(),
    };
    subscriptions.set(sub.id, sub);
    log.info(`Webhook subscribed: ${sub.id} → ${url} for [${events.join(', ')}]`);
    return sub;
  },

  /** Remove a subscription */
  unsubscribe(id: string): boolean {
    const removed = subscriptions.delete(id);
    if (removed) log.info(`Webhook unsubscribed: ${id}`);
    return removed;
  },

  /** List all subscriptions */
  list(): WebhookSubscription[] {
    return [...subscriptions.values()];
  },

  /** Emit an event to all matching subscribers */
  async emit(event: string, payload: Record<string, unknown>): Promise<void> {
    const matching = [...subscriptions.values()].filter(
      s => s.active && (s.events.includes(event) || s.events.includes('*'))
    );

    if (matching.length === 0) return;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      matching.map(sub => this._deliver(sub, event, body, 1))
    );
  },

  /** Internal: deliver with retry */
  async _deliver(sub: WebhookSubscription, event: string, body: string, attempt: number): Promise<void> {
    const start = Date.now();
    const signature = signPayload(body, sub.secret);

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Delivery': generateId(),
          'User-Agent': 'NamaInvest-ERP/2.4',
        },
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const duration = Date.now() - start;
      this._log(sub.id, event, res.status, duration, attempt);

      if (!res.ok && attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 4s, 9s
        const delay = attempt * attempt * 1000;
        setTimeout(() => this._deliver(sub, event, body, attempt + 1), delay);
      }
    } catch (err: any) {
      const duration = Date.now() - start;
      this._log(sub.id, event, 0, duration, attempt);
      log.warn(`Webhook delivery failed: ${sub.url} — ${err.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = attempt * attempt * 1000;
        setTimeout(() => this._deliver(sub, event, body, attempt + 1), delay);
      }
    }
  },

  /** Internal: log delivery */
  _log(subscriptionId: string, event: string, status: number, duration: number, attempt: number): void {
    deliveryLogs.push({ subscriptionId, event, status, duration, attempt, timestamp: new Date() });
    if (deliveryLogs.length > MAX_LOGS) deliveryLogs.splice(0, deliveryLogs.length - MAX_LOGS);
  },

  /** Get delivery logs */
  getLogs(limit = 50): DeliveryLog[] {
    return deliveryLogs.slice(-limit).reverse();
  },

  /** Get stats */
  stats(): { subscriptions: number; totalDeliveries: number; failedDeliveries: number } {
    return {
      subscriptions: subscriptions.size,
      totalDeliveries: deliveryLogs.length,
      failedDeliveries: deliveryLogs.filter(l => l.status === 0 || l.status >= 400).length,
    };
  },
};

// ── Supported Events ──
export const WEBHOOK_EVENTS = [
  'invoice.created', 'invoice.paid', 'invoice.cancelled',
  'payment.received', 'payment.refunded',
  'purchase.created', 'purchase.approved',
  'inventory.low', 'inventory.adjustment',
  'journal.posted', 'journal.reversed',
  'employee.hired', 'employee.terminated',
  'salary.processed',
  'customer.created', 'customer.updated',
  'zatca.reported', 'zatca.failed',
] as const;
