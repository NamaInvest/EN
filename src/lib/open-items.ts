// @ts-nocheck
import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items' });

export class OpenItemsEngine {
    
    /**
     * Creates an Open Item entry
     */
    static async createOpenItem(data: {
        partyId: number,
        partyType: 'customer' | 'vendor',
        documentType: string,
        documentId: number,
        documentNumber: string,
        documentDate: Date,
        amount: number,
        currency?: string,
        exchangeRate?: number,
        dueDate?: Date,
        tenantId: any
    }) {
        const currency = data.currency || 'SAR';
        const rate = data.exchangeRate || 1;
        const amountSAR = data.amount * rate;

        return prisma.openItem.create({
            data: {
                tenantId: data.tenantId,
                partyId: data.partyId,
                partyType: data.partyType,
                documentType: data.documentType,
                documentId: data.documentId,
                documentNumber: data.documentNumber,
                documentDate: data.documentDate,
                amount: amountSAR,
                openAmount: amountSAR,
                currency: currency,
                originalAmount: data.amount,
                originalOpenAmount: data.amount,
                exchangeRate: rate,
                dueDate: data.dueDate,
                status: 'OPEN'
            }
        });
    }

    /**
     * Apply a Payment with optional discount, writeoff, and FX calculation
     */
    static async applyPayment(paymentOpenItemId: number, allocations: any[], userId: string, tenantId: any) {
        return prisma.$transaction(async (tx) => {
            const payment = await tx.openItem.findFirst({ where: { id: paymentOpenItemId, tenantId }});
            if (!payment || payment.openAmount <= 0) throw new Error("Invalid payment");

            let remainingPaymentAmount = Number(payment.originalOpenAmount);
            const appliedList = [];
            let totalFxGainLoss = 0;

            for (const alloc of allocations) {
                const invoice = await tx.openItem.findFirst({ where: { id: alloc.invoiceId, tenantId }});
                if (!invoice) throw new Error("Invoice not found");

                const appliedAmount = Number(alloc.amount);
                const discountAmount = Number(alloc.discount || 0);
                const writeoffAmount = Number(alloc.writeoff || 0);
                
                const totalInvoiceReductionOriginal = appliedAmount + discountAmount + writeoffAmount;
                const totalInvoiceReductionSAR = totalInvoiceReductionOriginal * Number(invoice.exchangeRate);
                
                if (totalInvoiceReductionOriginal > Number(invoice.originalOpenAmount)) {
                    throw new Error("Cannot apply more than invoice open amount");
                }
                
                if (appliedAmount > remainingPaymentAmount) {
                    throw new Error("Payment remaining amount is not enough");
                }

                // FX Calculation (if payment is in a different rate or currency)
                const paymentSAR = appliedAmount * Number(payment.exchangeRate);
                const invoiceExpectedSAR = appliedAmount * Number(invoice.exchangeRate);
                const fxGainLoss = paymentSAR - invoiceExpectedSAR; // Rough calculation
                totalFxGainLoss += fxGainLoss;

                // Update Invoice
                const newInvOpenOrig = Number(invoice.originalOpenAmount) - totalInvoiceReductionOriginal;
                const newInvOpenSAR = Number(invoice.openAmount) - totalInvoiceReductionSAR;
                await tx.openItem.update({
                    where: { id: invoice.id }, // id is unique, but we verified tenant above
                    data: {
                        originalOpenAmount: newInvOpenOrig,
                        openAmount: newInvOpenSAR,
                        status: newInvOpenOrig <= 0.01 ? 'CLEARED' : 'PARTIAL'
                    }
                });

                // Update Payment
                remainingPaymentAmount -= appliedAmount;

                // Create Application Record
                const app = await tx.itemApplication.create({
                    data: {
                        tenantId: tenantId,
                        paymentOpenItemId: payment.id,
                        invoiceOpenItemId: invoice.id,
                        appliedAmount: appliedAmount,
                        appliedCurrency: payment.currency,
                        invoiceCurrency: invoice.currency,
                        paymentCurrency: payment.currency,
                        exchangeRateUsed: payment.exchangeRate,
                        fxGainLoss: fxGainLoss,
                        discountAmount: discountAmount,
                        writeoffAmount: writeoffAmount,
                        writeoffReason: alloc.writeoffReason,
                        matchStrategy: 'MANUAL',
                        appliedByUserId: userId
                    }
                });

                appliedList.push(app);
            }

            // Update Payment Open Item
            const newPaymentOpenSAR = remainingPaymentAmount * Number(payment.exchangeRate);
            await tx.openItem.update({
                where: { id: payment.id },
                data: {
                    originalOpenAmount: remainingPaymentAmount,
                    openAmount: newPaymentOpenSAR,
                    status: remainingPaymentAmount <= 0.01 ? 'CLEARED' : 'PARTIAL'
                }
            });

            return {
                appliedList,
                totalFxGainLoss
            };
        });
    }

    static async markAsDisputed(openItemId: number, amount: number, reasonCode: string, description: string, userId: string, tenantId: any) {
        return prisma.$transaction(async (tx) => {
            const item = await tx.openItem.findFirst({ where: { id: openItemId, tenantId }});
            if (!item) throw new Error("Item not found");

            const caseNum = `DSP-${Date.now()}`;

            const dispute = await tx.disputeCase.create({
                data: {
                    tenantId,
                    caseNumber: caseNum,
                    openItemId,
                    customerId: item.partyId,
                    amount,
                    currency: item.currency,
                    reasonCode,
                    reasonText: reasonCode, // normally fetch from DeductionReason
                    description,
                    raisedByUserId: userId,
                }
            });

            await tx.openItem.update({
                where: { id: openItemId },
                data: {
                    disputedAmount: Number(item.disputedAmount || 0) + amount,
                    disputeStatus: 'ACTIVE'
                }
            });

            return dispute;
        });
    }

    static async recordPromiseToPay(openItemId: number, amount: number, date: Date, userId: string, tenantId: any) {
        const item = await prisma.openItem.findFirst({ where: { id: openItemId, tenantId } });
        if (!item) throw new Error("Item not found");

        return prisma.openItem.update({
            where: { id: openItemId },
            data: {
                promiseToPayAmount: amount,
                promiseToPayDate: date,
                promiseStatus: 'ACTIVE'
            }
        });
    }
}
