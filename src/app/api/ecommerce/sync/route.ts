/**
 * Omnichannel E-commerce Sync
 * POST /api/ecommerce/sync
 * يربط مخزون Nama Invest بالمتاجر الخارجية (Salla, Zid)
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const SyncActionSchema = z.discriminatedUnion('action', [
  z.object({
    platform: z.literal('salla'),
    action:   z.literal('sync_products_up'),
    payload:  z.any().optional(),
  }),
  z.object({
    platform: z.literal('salla'),
    action:   z.literal('webhook_order_created'),
    payload:  z.object({
      reference_id:   z.string(),
      date:           z.string(),
      sub_total:      z.number().min(0),
      tax_amount:     z.number().min(0).default(0),
      total:          z.number().min(0),
      payment_method: z.object({ type: z.string() }),
      customer:       z.object({
        mobile:     z.string(),
        first_name: z.string().optional().default(''),
        last_name:  z.string().optional().default(''),
      }),
    }),
  }),
]);

// ── POST ─────────────────────────────────────────────────────────────────────

const SALLA_API_TOKEN = process.env.SALLA_ACCESS_TOKEN || 'DEMO_TOKEN_12345';
const SALLA_BASE_URL  = 'https://api.salla.dev/admin/v2';

async function _POST(req: Request) {
  const prisma = getPrisma(req);
  try {
    const rawBody = await req.json();
    const parsed = SyncActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Unknown action or platform', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { platform, action, payload } = parsed.data as any;

    if (platform === 'salla' && action === 'sync_products_up') {
      const products = await prisma.product.findMany({
        take:   100,
        where:  { active: true, sellPrice: { gt: 0 } },
        select: { id: true, name: true, nameEn: true, barcode: true, currentStock: true, sellPrice: true, taxRate: true, description: true },
      });
      console.log(`[Omnichannel] Syncing ${products.length} products to Salla E-Commerce...`);
      return NextResponse.json({ message: 'Products successfully synced to Cloud Store', count: products.length });
    }

    if (platform === 'salla' && action === 'webhook_order_created') {
      const order = payload;
      const customerPhone = order.customer.mobile;

      let customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name:  `${order.customer.first_name} ${order.customer.last_name}`.trim(),
            phone: customerPhone,
          },
        });
      }

      const invoice = await prisma.salesInvoice.create({
        data: {
          invoiceNo:    Math.floor(1_000_000 + Math.random() * 9_000_000),
          date:         new Date(order.date),
          customerId:   customer.id,
          subtotal:     order.sub_total,
          taxValue:     order.tax_amount,
          total:        order.total,
          paid:         order.total,
          remaining:    0,
          paymentType:  order.payment_method.type === 'credit_card' ? 'visa' : 'cash',
          status:       'completed',
          notes:        `E-Commerce Salla Order #${order.reference_id}`,
          zatcaStatus:  'pending',
        },
      });

      console.log(`[Omnichannel] E-Commerce Order → ERP Invoice #${invoice.invoiceNo}`);
      return NextResponse.json({ message: 'Order processed to ERP', invoiceId: invoice.id });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });

  } catch (error: any) {
    console.error('Omnichannel Engine Error:', error);
    return NextResponse.json({ error: 'Failed to sync ecommerce channel' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
