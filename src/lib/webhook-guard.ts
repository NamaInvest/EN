import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛡️ Webhook Guard
 * ══════════════════════════════════════════════════════
 * Prevents spoofing attacks by validating HMAC signatures on incoming Webhooks.
 * Used for ZATCA, GOSI, Mudad, and external integrations.
 */

export class WebhookGuard {
  /**
   * Validates the incoming webhook signature.
   * @param req The NextRequest object
   * @param rawBody The raw stringified body of the request
   * @param secret The integration-specific secret (e.g. MUDAD_WEBHOOK_SECRET)
   * @param signatureHeader The header containing the signature (e.g. 'x-mudad-signature')
   */
  static validateSignature(
    req: NextRequest, 
    rawBody: string, 
    secret: string | undefined, 
    signatureHeader: string
  ): boolean {
    if (!secret) {
        console.error(`[WebhookGuard] Security Error: Missing webhook secret for header ${signatureHeader}`);
        return false;
    }

    const providedSignature = req.headers.get(signatureHeader);
    if (!providedSignature) {
        console.warn(`[WebhookGuard] Missing signature header: ${signatureHeader}`);
        return false;
    }

    // Generate expected HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    // Secure timing-safe comparison to prevent timing attacks
    try {
      const providedBuffer = Buffer.from(providedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      if (providedBuffer.length !== expectedBuffer.length) {
          return false;
      }

      return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    } catch (e) {
      // Catch hex decoding errors
      return false;
    }
  }

  /**
   * Helper to wrap a route handler with HMAC validation.
   */
  static async withProtection(
    req: NextRequest,
    secretEnvName: string,
    signatureHeader: string,
    handler: (req: NextRequest, parsedBody: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      const rawBody = await req.text();
      const secret = process.env[secretEnvName];

      const isValid = this.validateSignature(req, rawBody, secret, signatureHeader);
      
      if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Webhook Signature' }, { status: 401 });
      }

      const parsedBody = JSON.parse(rawBody);
      return handler(req, parsedBody);
    } catch (error) {
      console.error('[WebhookGuard] Processing error:', error);
      return NextResponse.json({ error: 'Bad Request: Invalid payload structure' }, { status: 400 });
    }
  }
}
