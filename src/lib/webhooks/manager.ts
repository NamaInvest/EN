import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { syncQueue } from '../queue';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.webhooks.man' });

export class WebhookManager {
  /**
   * Dispatch an event to all interested webhooks.
   * This is generally called by the EventBus.
   */
  static async dispatchEvent(tenantId: string, eventName: string, payload: any): Promise<void> {
    // Find all subscriptions for this tenant that listen to this event (or all events '*')
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        tenantId,
        isActive: true,
      },
    });

    for (const sub of subscriptions) {
      let eventsArray: string[] = [];
      try {
        eventsArray = JSON.parse(sub.events as string);
      } catch (e) {
        continue;
      }

      if (eventsArray.includes(eventName) || eventsArray.includes('*')) {
        await this.enqueueDelivery(sub.id, sub.url, sub.secret, eventName, payload);
      }
    }
  }

  /**
   * Directly enqueue a specific webhook delivery
   */
  private static async enqueueDelivery(subscriptionId: number, url: string, secret: string, event: string, data: any) {
    const body = JSON.stringify({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      data,
    });

    const signature = this.sign(body, secret);

    await syncQueue.add(
      'webhook_delivery',
      {
        url,
        body,
        headers: {
          'Content-Type': 'application/json',
          'X-Namasoft-Signature': signature,
          'X-Namasoft-Event': event,
        },
        subscriptionId,
        event,
        attempt: 1,
        maxAttempts: 5,
      },
      {
        backoff: { type: 'exponential', delay: 5000 }, // 5s, 25s, 125s, etc.
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs in queue history
      }
    );
  }

  private static sign(body: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }
}
