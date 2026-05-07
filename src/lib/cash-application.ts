// @ts-nocheck
import { PrismaClient, CashApplicationBatch, OpenItem } from '@prisma/client';

const prisma = new PrismaClient();

export class CashApplicationEngine {
    /**
     * Auto-apply a payment to open invoices based on a strategy
     */
    static async autoApply(
        paymentId: number, // OpenItem ID where documentType = 'payment'
        strategy: 'FIFO' | 'LIFO' | 'LARGEST_FIRST' | 'BY_REFERENCE',
        userId: number
    ): Promise<CashApplicationBatch> {
        // 1. Get the payment OpenItem
        const payment = await prisma.openItem.findUnique({
            where: { id: paymentId }
        });

        if (!payment || payment.documentType !== 'payment') {
            throw new Error("Invalid payment ID");
        }

        if (Number(payment.openAmount) <= 0) {
            throw new Error("Payment has no open amount to apply");
        }

        // 2. Get open invoices for this customer
        let invoices = await prisma.openItem.findMany({
            take: 100,
            where: {
                partyId: payment.partyId,
                partyType: 'customer',
                documentType: 'invoice',
                openAmount: { gt: 0 }
            }
        });

        if (invoices.length === 0) {
            throw new Error("No open invoices found for this customer");
        }

        // 3. Sort invoices based on strategy
        switch (strategy) {
            case 'FIFO':
                invoices.sort((a, b) => (a.dueDate || new Date(0)).getTime() - (b.dueDate || new Date(0)).getTime());
                break;
            case 'LIFO':
                invoices.sort((a, b) => (b.dueDate || new Date(0)).getTime() - (a.dueDate || new Date(0)).getTime());
                break;
            case 'LARGEST_FIRST':
                invoices.sort((a, b) => Number(b.openAmount) - Number(a.openAmount));
                break;
            case 'BY_REFERENCE':
                // Complex matching logic would go here
                break;
        }

        // 4. Apply payment amount across invoices
        let remainingToApply = Number(payment.openAmount);
        const applications: any[] = [];

        for (const invoice of invoices) {
            if (remainingToApply <= 0) break;

            const invoiceOpenAmount = Number(invoice.openAmount);
            const appliedAmount = Math.min(remainingToApply, invoiceOpenAmount);
            
            applications.push({
                invoiceId: invoice.id,
                appliedAmount,
                discountTaken: 0,
                writeOffAmount: 0,
                remainingInvoiceBalance: invoiceOpenAmount - appliedAmount
            });

            remainingToApply -= appliedAmount;
        }

        const totalApplied = Number(payment.openAmount) - remainingToApply;

        // 5. Save the batch transaction
        const batch = await prisma.$transaction(async (tx) => {
            const newBatch = await tx.cashApplicationBatch.create({
                data: {
                    customerId: payment.partyId,
                    paymentId: payment.id,
                    totalReceived: Number(payment.amount),
                    totalApplied: totalApplied,
                    unappliedAmount: remainingToApply,
                    applicationMethod: 'AUTO_' + strategy,
                    appliedBy: userId,
                    applications: {
                        create: applications
                    }
                },
                include: { applications: true }
            });

            // Update Payment OpenItem
            await tx.openItem.update({
                where: { id: payment.id },
                data: {
                    openAmount: remainingToApply,
                    status: remainingToApply <= 0 ? 'CLEARED' : 'PARTIAL'
                }
            });

            // Update Invoice OpenItems
            for (const app of applications) {
                await tx.openItem.update({
                    where: { id: app.invoiceId },
                    data: {
                        openAmount: app.remainingInvoiceBalance,
                        status: app.remainingInvoiceBalance <= 0 ? 'CLEARED' : 'PARTIAL'
                    }
                });
            }

            return newBatch;
        });

        return batch;
    }

    /**
     * Handle manual applications with custom amounts and write-offs
     */
    static async manualApply(
        paymentId: number, 
        applications: { invoiceId: number, amount: number, discount: number, writeOff: number }[],
        userId: number
    ): Promise<CashApplicationBatch> {
        const payment = await prisma.openItem.findUnique({ where: { id: paymentId } });
        if (!payment || payment.documentType !== 'payment') throw new Error("Invalid payment");

        let totalApplied = 0;
        const appRecords: any[] = [];

        for (const app of applications) {
            const invoice = await prisma.openItem.findUnique({ where: { id: app.invoiceId } });
            if (!invoice) throw new Error(`Invoice ${app.invoiceId} not found`);

            const appliedAmt = app.amount;
            totalApplied += appliedAmt;

            appRecords.push({
                invoiceId: invoice.id,
                appliedAmount: appliedAmt,
                discountTaken: app.discount,
                writeOffAmount: app.writeOff,
                remainingInvoiceBalance: Number(invoice.openAmount) - appliedAmt - app.discount - app.writeOff
            });
        }

        if (totalApplied > Number(payment.openAmount)) {
            throw new Error("Cannot apply more than the available payment amount");
        }

        const remainingToApply = Number(payment.openAmount) - totalApplied;

        return await prisma.$transaction(async (tx) => {
            const newBatch = await tx.cashApplicationBatch.create({
                data: {
                    customerId: payment.partyId,
                    paymentId: payment.id,
                    totalReceived: Number(payment.amount),
                    totalApplied: totalApplied,
                    unappliedAmount: remainingToApply,
                    applicationMethod: 'MANUAL',
                    appliedBy: userId,
                    applications: { create: appRecords }
                },
                include: { applications: true }
            });

            await tx.openItem.update({
                where: { id: payment.id },
                data: { openAmount: remainingToApply, status: remainingToApply <= 0 ? 'CLEARED' : 'PARTIAL' }
            });

            for (const app of appRecords) {
                await tx.openItem.update({
                    where: { id: app.invoiceId },
                    data: { openAmount: app.remainingInvoiceBalance, status: app.remainingInvoiceBalance <= 0 ? 'CLEARED' : 'PARTIAL' }
                });
            }

            return newBatch;
        });
    }
}
