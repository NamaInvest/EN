export interface Webhook {
  id: string;
  url: string;
  secret: string;
}

export class WebhookManager {
  async send(webhook: Webhook, payload: any): Promise<void> {
    const body = JSON.stringify({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      event: payload.event,
      data: payload.data,
    });

    const signature = this.sign(body, webhook.secret);

    // Dummy Push to BullMQ
    console.log(`[WebhookManager] Enqueuing webhook delivery for ${webhook.url} with signature ${signature}`);
  }

  private sign(body: string, secret: string): string {
    // Dummy signature
    return `sha256=dummy_signature_${secret}`;
  }
}

export const webhookManager = new WebhookManager();
