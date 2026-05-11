import { prisma } from './prisma';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'webhook-engine' });

export class WebhookEngine {
  static sign(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  static async dispatch(subscriptionId: number, event: string, payload: object, maxRetries = 3) {
    const subscription = await prisma.webhookSubscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = this.sign(body, subscription.secret);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(subscription.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-NamaSoft-Signature': signature },
          body,
        });
        await prisma.webhookDeliveryLog.create({
          data: { tenantId: subscription.tenantId, subscriptionId, event, statusCode: res.status },
        });
        if (res.ok) {
          log.info(`Webhook ${subscriptionId} delivered (attempt ${attempt})`);
          await prisma.webhookSubscription.update({ where: { id: subscriptionId }, data: { lastDeliveredAt: new Date(), failCount: 0 } });
          return;
        }
      } catch (err: unknown) {
        const delay = Math.pow(2, attempt) * 1000;
        log.warn(`Webhook ${subscriptionId} attempt ${attempt} failed, retry in ${delay}ms`);
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, delay));
      }
    }
    await prisma.webhookSubscription.update({ where: { id: subscriptionId }, data: { failCount: { increment: 1 } } });
    log.error(`Webhook ${subscriptionId} failed after ${maxRetries} attempts`);
  }
}
