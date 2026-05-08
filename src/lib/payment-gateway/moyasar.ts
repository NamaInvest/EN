import { prisma } from '../prisma';

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

export class MoyasarEngine {
    static async createCharge(invoiceId: number, amount: number, source: any) {
        // Find gateway credentials
        const gateway = await prisma.paymentGateway.findFirst({
            where: { provider: 'MOYASAR', isActive: true }
        });

        if (!gateway) throw new Error('Moyasar gateway is not configured.');

        const creds = JSON.parse(gateway.credentials);
        const secretKey = gateway.env === 'PROD' ? creds.secretKey : creds.testSecretKey;

        // In a real app, this makes a fetch request to Moyasar
        // For demonstration, we mock the success
        /*
        const response = await fetch(`${MOYASAR_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // in halalas
                currency: 'SAR',
                description: `Invoice ${invoiceId}`,
                source: source // e.g. { type: 'creditcard', name, number, cvc, month, year }
            })
        });
        const data = await response.json();
        */

        // Mock response
        const _data_dup36 = {
            id: `moyasar_${Date.now()}`,
            status: 'paid', // paid, failed, initiated
            message: 'APPROVED'
        };

        // @ts-expect-error [TS2304] Cannot find name
        if (data.status === 'failed') {
            await prisma.paymentTransaction.create({
                data: {
                    gatewayId: gateway.id,
                    invoiceId,
                    amount,
                    currency: 'SAR',
                    method: 'CARD', // simplified
                    status: 'FAILED',
                    // @ts-expect-error [TS2304] Cannot find name
                    failureReason: data.message
                }
            });
            // @ts-expect-error [TS2304] Cannot find name
            throw new Error(`Payment failed: ${data.message}`);
        }

        // Paid successfully
        const transaction = await prisma.paymentTransaction.create({
            data: {
                gatewayId: gateway.id,
                invoiceId,
                amount,
                currency: 'SAR',
                method: 'CARD',
                // @ts-expect-error [TS2304] Cannot find name
                providerTransactionId: data.id,
                status: 'CAPTURED',
                capturedAt: new Date()
            }
        });

        // Auto-post payment to SalesInvoice
        await prisma.salesInvoice.update({
            where: { id: invoiceId },
            data: {
                paid: { increment: amount },
                remaining: { decrement: amount },
                status: 'paid'
            }
        });

        return transaction;
    }

    static async refundCharge(transactionId: number, amount?: number) {
        const tx = await prisma.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: { gateway: true }
        });

        if (!tx || !tx.providerTransactionId) throw new Error('Transaction not found');
        
        // Mock refund
        await prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: { status: 'REFUNDED', refundedAt: new Date() }
        });

        return { success: true, message: 'Refunded successfully' };
    }
}
