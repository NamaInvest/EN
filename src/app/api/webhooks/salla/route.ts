import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import crypto from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';

import { getUserFromRequest } from '@/lib/auth';
function verifySallaSignature(bodyStr: string, secret: string, signature: string) {
    const hash = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
    return hash === signature;
}

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const signature = request.headers.get('x-salla-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing Signature' }, { status: 401 });
        }

        const rawBody = await request.text();

        // Fetch Salla config directly from database to get the secret
        const settings = await prisma.setting.findMany({
            take: 100,
            where: { key: { in: ['salla_enabled', 'salla_client_secret'] } }
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
        const { event, event_id, data } = payload;
        
        console.log(`[Salla Webhook] Received Event: ${event} (ID: ${event_id})`);

        if (event === 'order.created') {
            await handleSallaOrderCreated(data, prisma);
        } else if (event === 'app.store.authorize') {
            // Store authorized our app
            console.log('✅ Salla App Authorized:', data);
        }

        return NextResponse.json({ success: true, message: 'Webhook Processed' });
    } catch (error: any) {
        console.error('Salla Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleSallaOrderCreated(order: any, prisma: any) {
    // Determine total and tax based on Salla payload
    const total = order.amounts?.total?.amount || 0;
    const subtotal = order.amounts?.sub_total?.amount || 0;
    const taxValue = order.amounts?.tax?.amount || 0;

    // We assume an online order is fully paid. Create a generic customer if not present.
    const customerPhone = order.customer?.mobile || order.customer?.phone || '0000000000';
    const customerName = (order.customer?.first_name || '') + ' ' + (order.customer?.last_name || '');

    // Get next invoice number
    const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
    const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;

    // Find main stock (warehouse 1)
    const mainStock = await prisma.stock.findFirst({ orderBy: { id: 'asc' } });
    const stockId = mainStock?.id || 1;

    await prisma.$transaction(async (tx: any) => {
        // Find Customer by phone or create
        let customer = await tx.customer.findFirst({ where: { phone: customerPhone } });
        if (customer) {
            customer = await tx.customer.update({
                where: { id: customer.id },
                data: { name: customerName }
            });
        } else {
            customer = await tx.customer.create({
                data: { name: customerName || 'Salla Customer', phone: customerPhone }
            });
        }

        const createdInvoice = await tx.salesInvoice.create({
            data: {
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
                paymentType: 'online', // Salla Order
                status: 'completed',
                notes: `Salla Order #${order.reference_id}`,
                details: {
                    create: order.items.map((item: any) => {
                        const qty = item.quantity || 1;
                        const price = item.amounts?.price_without_tax?.amount || item.price?.amount || 0;
                        const itemTax = item.amounts?.tax?.amount || 0;
                        const itemTotal = item.amounts?.total?.amount || price;

                        return {
                            productId: 1, // Fallback product ID
                            productName: item.name,
                            quantity: qty,
                            price: price,
                            discountRate: 0,
                            discountValue: 0,
                            taxRate: 15, // Defaulting assuming KSA VAT
                            taxValue: itemTax,
                            total: itemTotal,
                        };
                    })
                }
            },
            include: { details: true }
        });

        // Loop items to match by SKU/Barcode and deduct real local stock
        for (const item of order.items) {
            const sku = item.sku;
            const qty = item.quantity || 1;
            
            if (sku) {
                const localProd = await tx.product.findUnique({ where: { barcode: sku } });
                if (localProd) {
                    // Update actual product ID on the invoice line
                    await tx.salesInvoiceDetail.updateMany({
                        where: { invoiceId: createdInvoice.id, productName: item.name },
                        data: { productId: localProd.id }
                    });

                    // Deduct Global Stock
                    await tx.product.update({
                        where: { id: localProd.id },
                        data: { currentStock: { decrement: qty } }
                    });

                    // Deduct Warehouse specific Stock
                    try {
                        await tx.productStock.upsert({
                            where: { productId_stockId: { productId: localProd.id, stockId } },
                            update: { quantity: { decrement: qty } },
                            create: { productId: localProd.id, stockId, quantity: -qty },
                        });
                    } catch (e: any) {
                        console.error('Failed to update productStock for Salla webhook inside tx:', e);
                    }
                }
            }
        }

        // Add to Treasury
        await tx.treasury.create({
            data: { 
                type: 'in', amount: total, 
                description: `مبيعات سلة أونلاين - فاتورة #${invoiceNo}`, 
                referenceType: 'sale', referenceId: createdInvoice.id 
            }
        });
    });

    // Accounting Journal creation (done outside transaction to avoid blocking it if journal fails)
    try {
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
        });
    } catch (jErr: unknown) {
        console.error('Auto-journal for Salla webhook failed:', jErr);
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
