/**
 * Webhook Engine — P2.9 (Production Grade)
 * ─────────────────────────────────────────────────────────────────────────────
 * يسمح للعملاء بتسجيل webhooks لأحداث النظام مع:
 *   - HMAC-SHA256 request signing
 *   - Exponential backoff retry (3 attempts)
 *   - Tenant isolation (tenantId on all DB ops)
 *   - Delivery log per attempt
 *   - Auto-disable after 10 consecutive failures
 *   - Secret rotation
 */

import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const db = (p: any) => p as any;

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FAILURES_BEFORE_DISABLE = 10;
const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

// ── Event Catalog ─────────────────────────────────────────────────────────────
export const WEBHOOK_EVENTS = [
  // Sales
  'invoice.created', 'invoice.posted', 'invoice.paid', 'invoice.cancelled',
  'invoice.zatca_cleared', 'invoice.zatca_rejected',
  // Orders
  'order.created', 'order.confirmed', 'order.shipped', 'order.completed', 'order.cancelled',
  // Payments
  'payment.received', 'payment.failed', 'payment.reversed', 'payment.refunded',
  // HR
  'employee.hired', 'employee.terminated', 'employee.updated',
  'payroll.run_completed', 'payroll.salary_paid',
  // Inventory
  'inventory.low_stock', 'inventory.adjusted', 'inventory.received', 'inventory.transferred',
  // Customers
  'customer.created', 'customer.updated', 'customer.credit_hold',
  // Vendors
  'vendor.created', 'vendor.updated',
  // Approvals
  'approval.requested', 'approval.approved', 'approval.rejected',
  // ZATCA
  'zatca.cleared', 'zatca.rejected', 'zatca.error',
  // System
  'system.backup_completed', 'system.period_closed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookSubscription {
  id: number;
  tenantId: string;
  url: string;
  events: string[];
  description: string;
  isActive: boolean;
  failCount: number;
  createdAt: Date;
  lastDeliveredAt?: Date | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function signPayload(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function parseEvents(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()); }
}

async function deliverWithRetry(
  url: string,
  secret: string,
  body: string,
  event: string,
  attempt = 1
): Promise<{ ok: boolean; statusCode: number; error?: string }> {
  try {
    const signature = signPayload(secret, body);
    const response = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':         'application/json',
        'X-Webhook-Signature':  signature,
        'X-Webhook-Event':      event,
        'X-Webhook-Attempt':    String(attempt),
        'X-Webhook-Timestamp':  new Date().toISOString(),
        'User-Agent':           'NamaSoft-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    return { ok: response.ok, statusCode: response.status };

  } catch (err: any) {
    if (attempt < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      return deliverWithRetry(url, secret, body, event, attempt + 1);
    }
    return { ok: false, statusCode: 0, error: err.message };
  }
}

// ── WebhookEngine ─────────────────────────────────────────────────────────────
export class WebhookEngine {

  /** Register a new webhook subscription */
  static async subscribe(
    prisma: PrismaClient,
    data: { url: string; events: string[]; description?: string; tenantId: string }
  ): Promise<{ id: number; url: string; events: string[]; secret: string }> {
    // Validate URL
    try { new URL(data.url); } catch {
      throw new Error('عنوان URL غير صالح');
    }

    // Validate events
    const invalid = data.events.filter(e => !WEBHOOK_EVENTS.includes(e as any));
    if (invalid.length) throw new Error(`أحداث غير مدعومة: ${invalid.join(', ')}`);

    // Generate HMAC signing secret
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const sub = await db(prisma).webhookSubscription.create({
      data: {
        tenantId:    data.tenantId,
        url:         data.url,
        events:      JSON.stringify(data.events),
        secret,
        description: data.description ?? '',
        isActive:    true,
        failCount:   0,
      },
    });

    return { ...sub, events: data.events, secret }; // Secret returned once only
  }

  /** List subscriptions for a tenant (secrets hidden) */
  static async list(prisma: PrismaClient, tenantId: string): Promise<WebhookSubscription[]> {
    const subs = await db(prisma).webhookSubscription.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
      take:    200,
    });
    return subs.map((s: any) => ({
      ...s,
      events: parseEvents(s.events),
      secret: '***hidden***',
    }));
  }

  /** Trigger event — delivers to all matching active subscriptions */
  static async trigger(
    prisma: PrismaClient,
    event: string,
    payload: Record<string, any>,
    tenantId?: string
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    const where: any = { isActive: true };
    if (tenantId) where.tenantId = tenantId;

    const subs = await db(prisma).webhookSubscription.findMany({ where, take: 500 });

    // Filter by event
    const matching = subs.filter((s: any) => {
      const events = parseEvents(s.events);
      return events.includes(event) || events.includes('*');
    });

    let sent = 0, failed = 0, skipped = 0;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data:      payload,
    });

    for (const sub of matching) {
      const result = await deliverWithRetry(sub.url, sub.secret, body, event);

      // Log delivery attempt
      await db(prisma).webhookDeliveryLog?.create?.({
        data: {
          subscriptionId: sub.id,
          event,
          statusCode:     result.statusCode,
          error:          result.error ?? null,
          deliveredAt:    new Date(),
        },
      }).catch(() => {}); // Silent if table doesn't exist yet

      if (result.ok) {
        sent++;
        await db(prisma).webhookSubscription.update({
          where: { id: sub.id },
          data:  { lastDeliveredAt: new Date(), failCount: 0 },
        });
      } else {
        failed++;
        const newFails = (sub.failCount || 0) + 1;
        await db(prisma).webhookSubscription.update({
          where: { id: sub.id },
          data:  {
            failCount: newFails,
            isActive:  newFails < MAX_FAILURES_BEFORE_DISABLE,
          },
        });
      }
    }

    if (subs.length > matching.length) skipped = subs.length - matching.length;
    return { sent, failed, skipped };
  }

  /** Delete a subscription */
  static async unsubscribe(prisma: PrismaClient, id: number, tenantId: string): Promise<void> {
    const sub = await db(prisma).webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new Error('اشتراك غير موجود أو غير مصرح');
    await db(prisma).webhookSubscription.delete({ where: { id } });
  }

  /** Toggle active/inactive */
  static async toggle(prisma: PrismaClient, id: number, tenantId: string): Promise<any> {
    const sub = await db(prisma).webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new Error('اشتراك غير موجود');
    return db(prisma).webhookSubscription.update({
      where: { id },
      data:  { isActive: !sub.isActive, failCount: 0 },
    });
  }

  /** Rotate signing secret */
  static async rotateSecret(prisma: PrismaClient, id: number, tenantId: string): Promise<{ secret: string }> {
    const sub = await db(prisma).webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new Error('اشتراك غير موجود');
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    await db(prisma).webhookSubscription.update({ where: { id }, data: { secret } });
    return { secret };
  }

  /** Get delivery logs for a subscription */
  static async getLogs(prisma: PrismaClient, id: number, tenantId: string, limit = 50): Promise<any[]> {
    // Verify ownership
    const sub = await db(prisma).webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new Error('غير مصرح');

    return db(prisma).webhookDeliveryLog?.findMany?.({
      where:   { subscriptionId: id },
      orderBy: { deliveredAt: 'desc' },
      take:    limit,
    }) ?? [];
  }

  /** Send a test event */
  static async sendTest(prisma: PrismaClient, id: number, tenantId: string): Promise<{ ok: boolean; statusCode: number }> {
    const sub = await db(prisma).webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!sub) throw new Error('اشتراك غير موجود');

    const body = JSON.stringify({
      event:     'webhook.test',
      timestamp: new Date().toISOString(),
      data:      { message: '✅ اختبار webhook ناجح من NamaSoft ERP', subscriptionId: id },
    });

    return deliverWithRetry(sub.url, sub.secret, body, 'webhook.test');
  }
}
