import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import crypto from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { runFinancialTx } from '@/lib/db/transaction';
import { TreasuryPostingService } from '@/lib/services/treasury-posting.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ route: 'webhooks/salla' });

/** Timing-safe HMAC comparison */
function verifySallaSignature(bodyStr: string, secret: string, signature: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
    if (expected.length !== signature.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (err: unknown) {
        EnterpriseLogger.error('Signature verification failed', { error: err instanceof Error ? err.message : err });
        return false; 
    }
}

const SallaPayloadSchema = z.object({
    event:    z.string().min(1),
    event_id: z.string().optional(),
    data:     z.any(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    const tenantId = 'default'; 
    try {
        const signature = request.headers.get('x-salla-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing Signature' }, { status: 401 });
        }

        const rawBody = await request.text();

        const settings = await prisma.setting.findMany({ take: 100,
            where: { tenantId, key: { in: ['salla_enabled', 'salla_client_secret'] } }
        });
        const config: Record<string, string> = {};
        settings.forEach(s => config[s.key] = s.value || '');

        if (config['salla_enabled'] !== '1' || !config['salla_client_secret']) {
            return NextResponse.json({ error: 'Salla integration disabled' }, { status: 403 });
        }

        const isValid = verifySallaSignature(rawBody, config['salla_client_secret'], signature);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const parsedPayload = SallaPayloadSchema.safeParse(payload);
        if (!parsedPayload.success) {
            return NextResponse.json({ error: 'Invalid webhook payload structure' }, { status: 400 });
        }
        const { event, event_id, data } = parsedPayload.data;
        
        EnterpriseLogger.traceFinancialTx(
            `SALLA_WEBHOOK_${event_id}`,
            'SALLA_WEBHOOK_RECEIVED',
            tenantId,
            { event, event_id }
        );

        if (event === 'order.created') {
            await handleSallaOrderCreated(data, prisma, tenantId);
        } else if (event === 'app.store.authorize') {
            log.info('✅ Salla App Authorized:', data);
        }

        return NextResponse.json({ success: true, message: 'Webhook Processed' });
    } catch (error: any) {
        EnterpriseLogger.error('Salla Webhook Error:', { tenantId }, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleSallaOrderCreated(order: any, prisma: any, tenantId: string) {
    const total = order.amounts?.total?.amount || 0;
    const subtotal = order.amounts?.sub_total?.amount || 0;
    const taxValue = order.amounts?.tax?.amount || 0;

    const customerPhone = order.customer?.mobile || order.customer?.phone || '0000000000';
    const customerName = (order.customer?.first_name || '') + ' ' + (order.customer?.last_name || '');

    await runFinancialTx(prisma, async (tx: any) => {
        const lastInvoice = await tx.salesInvoice.findFirst({ where: { tenantId }, orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;

        const mainStock = await tx.stock.findFirst({ where: { tenantId }, orderBy: { id: 'asc' } });
        const stockId = mainStock?.id || 1;

        let customer = await tx.customer.findFirst({ where: { tenantId, phone: customerPhone } });
        if (customer) {
            customer = await tx.customer.update({
                where: { id: customer.id },
                data: { name: customerName }
            });
        } else {
            customer = await tx.customer.create({
                data: { tenantId, name: customerName || 'Salla Customer', phone: customerPhone }
            });
        }

        const createdInvoice = await tx.salesInvoice.create({
            data: {
                tenantId,
                date: new Date(),
                invoiceNo,
                customerId: customer.id,
                stockId,
                subtotal,
                discountRate: 0,
                discountValue: 0,
                taxValue,
                total,
                paid: total,
                remaining: 0,
                paymentType: 'online', 
                status: 'completed',
                notes: `Salla Order #${order.reference_id}`,
                details: {
                    create: order.items.map((item: any) => {
                        const qty = item.quantity || 1;
                        const price = item.amounts?.price_without_tax?.amount || item.price?.amount || 0;
                        const itemTax = item.amounts?.tax?.amount || 0;
                        const itemTotal = item.amounts?.total?.amount || price;

                        return {
                            tenantId,
                            productId: 1, 
                            productName: item.name,
                            quantity: qty,
                            price: price,
                            discountRate: 0,
                            discountValue: 0,
                            taxRate: 15, 
                            taxValue: itemTax,
                            total: itemTotal,
                        };
                    })
                }
            },
            include: { details: true }
        });

        await tx.auditLog.create({
            data: {
                tenantId,
                userId: 1,
                action: 'SALLA_ORDER_CREATED',
                entityType: 'SalesInvoice',
                entityId: String(createdInvoice.id),
                newData: { status: 'completed', sallaOrderId: order.reference_id }
            }
        });

        for (const item of order.items) {
            const sku = item.sku;
            const qty = item.quantity || 1;
            
            if (sku) {
                const localProd = await tx.product.findFirst({ where: { tenantId, barcode: sku } });
                if (localProd) {
                    await tx.salesInvoiceDetail.updateMany({
                        where: { invoiceId: createdInvoice.id, productName: item.name },
                        data: { productId: localProd.id }
                    });

                    await tx.product.update({
                        where: { id: localProd.id },
                        data: { currentStock: { decrement: qty } }
                    });

                    try {
                        await InventoryService.adjustStock(tx, {
                            tenantId,
                            productId: localProd.id,
                            stockId,
                            quantityChange: -qty,
                            reason: `Salla Order #${order.reference_id}`,
                            sourceType: 'SALLA_WEBHOOK',
                            reference: `SI-${createdInvoice.id}`
                        });

                        await InventoryService.recordMovement(tx, {
                            tenantId,
                            productId: localProd.id,
                            stockId,
                            quantity: -qty,
                            type: 'OUT',
                            referenceType: 'sale',
                            referenceId: createdInvoice.id,
                            notes: `مبيعات سلة أونلاين - فاتورة #${invoiceNo}`
                        });
                    } catch (e: any) {
                        EnterpriseLogger.error('Failed to update productStock for Salla webhook inside tx', { tenantId }, e);
                    }
                }
            }
        }

        await TreasuryPostingService.createTreasuryEntry(tx, {
            type: 'in', 
            amount: total, 
            description: `مبيعات سلة أونلاين - فاتورة #${invoiceNo}`, 
            referenceType: 'sale', 
            referenceId: createdInvoice.id,
            date: new Date()
        }, null, null);

        await postSalesInvoice({
            invoiceNo,
            subtotal,
            taxValue,
            total,
            paymentType: 'online',
            splitCash: 0,
            splitCard: total,
            discountValue: 0,
            date: new Date().toISOString().split('T')[0],
            txClient: tx
        });
        
    }, 'SALLA_WEBHOOK_ORDER');
}

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = 'default';
    const idempotencyKey = req.headers.get('x-salla-event-id');
    if (idempotencyKey) {
        const isUnique = await lockIdempotencyKey(tenantString, 'salla_webhook', idempotencyKey);
        if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    }
    
    try {
        const response = await _POST(req as any);
        if (idempotencyKey && response.status >= 200 && response.status < 400) {
            await completeIdempotencyKey(tenantString, 'salla_webhook', idempotencyKey);
        } else if (idempotencyKey) {
            await unlockIdempotencyKey(tenantString, 'salla_webhook', idempotencyKey);
        }
        return response;
    } catch (e) {
        if (idempotencyKey) await unlockIdempotencyKey(tenantString, 'salla_webhook', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT' });
