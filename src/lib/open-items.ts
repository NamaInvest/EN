// @ts-nocheck
import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';

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

            // Phase C.1: Final FX Implementation Plan
            const FX_MATERIALITY_THRESHOLD = 0.01;
            let settingsLoaded = false;
            let fxGainSetting: any = null;
            let fxLossSetting: any = null;
            let fxGainAccountId: number | null = null;
            let fxLossAccountId: number | null = null;
            const fxJournalLines: Array<{ accountCode: string; debit: number; credit: number; vendorId?: number; customerId?: number; description?: string }> = [];

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
                const rawFxGainLoss = paymentSAR - invoiceExpectedSAR;
                const roundedFx = Math.round(rawFxGainLoss * 100) / 100;
                totalFxGainLoss += roundedFx;

                let appliedFxGainLossAccountId: number | null = null;

                if (Math.abs(roundedFx) >= FX_MATERIALITY_THRESHOLD) {
                    if (!settingsLoaded) {
                        fxGainSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_GAIN_GL_CODE' } });
                        fxLossSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_LOSS_GL_CODE' } });
                        if (!fxGainSetting?.value || !fxLossSetting?.value) {
                            throw new Error("FX accounts not configured in Settings");
                        }
                        const gainAcc = await tx.account.findFirst({ where: { tenantId, code: fxGainSetting.value } });
                        const lossAcc = await tx.account.findFirst({ where: { tenantId, code: fxLossSetting.value } });
                        if (!gainAcc) throw new Error(`FX Gain GL Account not found for code: ${fxGainSetting.value}`);
                        if (!lossAcc) throw new Error(`FX Loss GL Account not found for code: ${fxLossSetting.value}`);
                        fxGainAccountId = gainAcc.id;
                        fxLossAccountId = lossAcc.id;
                        settingsLoaded = true;
                    }

                    // Determine Directionality
                    let isGain = false;
                    let apArAccountCode = '';
                    let apArLine: any = { accountCode: '', debit: 0, credit: 0, description: `FX Adjustment for Payment ${payment.documentNumber} to Invoice ${invoice.documentNumber}` };
                    let fxLine: any = { accountCode: '', debit: 0, credit: 0, description: `FX Adjustment for Payment ${payment.documentNumber} to Invoice ${invoice.documentNumber}` };

                    const absFx = Math.abs(roundedFx);

                    if (payment.partyType === 'vendor') {
                        apArAccountCode = ACCOUNTS.PAYABLES;
                        apArLine.vendorId = payment.partyId;
                        if (roundedFx > 0) {
                            // Paid more SAR than expected -> Loss
                            isGain = false;
                            fxLine.accountCode = fxLossSetting.value;
                            fxLine.debit = absFx;
                            apArLine.accountCode = apArAccountCode;
                            apArLine.credit = absFx;
                            appliedFxGainLossAccountId = fxLossAccountId;
                        } else {
                            // Paid less SAR than expected -> Gain
                            isGain = true;
                            apArLine.accountCode = apArAccountCode;
                            apArLine.debit = absFx;
                            fxLine.accountCode = fxGainSetting.value;
                            fxLine.credit = absFx;
                            appliedFxGainLossAccountId = fxGainAccountId;
                        }
                    } else if (payment.partyType === 'customer') {
                        apArAccountCode = ACCOUNTS.RECEIVABLES;
                        apArLine.customerId = payment.partyId;
                        if (roundedFx > 0) {
                            // Received more SAR than expected -> Gain
                            isGain = true;
                            apArLine.accountCode = apArAccountCode;
                            apArLine.debit = absFx;
                            fxLine.accountCode = fxGainSetting.value;
                            fxLine.credit = absFx;
                            appliedFxGainLossAccountId = fxGainAccountId;
                        } else {
                            // Received less SAR than expected -> Loss
                            isGain = false;
                            fxLine.accountCode = fxLossSetting.value;
                            fxLine.debit = absFx;
                            apArLine.accountCode = apArAccountCode;
                            apArLine.credit = absFx;
                            appliedFxGainLossAccountId = fxLossAccountId;
                        }
                    } else {
                        throw new Error("Invalid partyType for FX calculation");
                    }

                    fxJournalLines.push(apArLine, fxLine);
                }

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
                        fxGainLoss: Math.abs(roundedFx) >= FX_MATERIALITY_THRESHOLD ? roundedFx : 0,
                        fxGainLossAccountId: appliedFxGainLossAccountId,
                        discountAmount: discountAmount,
                        writeoffAmount: writeoffAmount,
                        writeoffReason: alloc.writeoffReason,
                        matchStrategy: 'MANUAL',
                        appliedByUserId: userId
                    }
                });

                appliedList.push(app);
            }

            // --- Create FX Journal Entry if lines exist ---
            if (fxJournalLines.length > 0) {
                const numUserId = userId && userId !== 'system-user' && !isNaN(Number(userId)) ? Number(userId) : undefined;
                const journal = await createJournalEntry({
                    description: `FX Realization for Payment Application ${payment.documentNumber}`,
                    reference: `APP-PAY-${payment.id}-FX`,
                    lines: fxJournalLines,
                    userId: numUserId,
                    date: new Date().toISOString(),
                    txClient: tx
                });

                if (!journal.success || !journal.entryId) {
                    throw new Error(`Failed to create FX Journal Entry: ${journal.error}`);
                }
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
