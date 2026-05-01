import { prisma } from './prisma';

export class OpenItemsEngine {
    
    /**
     * Creates an Open Item entry when an invoice or payment is posted
     */
    static async createOpenItem(data: {
        partyId: number,
        partyType: 'customer' | 'vendor',
        documentType: string,
        documentId: number,
        amount: number,
        dueDate?: Date
    }) {
        return prisma.openItem.create({
            data: {
                partyId: data.partyId,
                partyType: data.partyType,
                documentType: data.documentType,
                documentId: data.documentId,
                amount: data.amount,
                openAmount: data.amount,
                dueDate: data.dueDate,
                status: 'OPEN'
            }
        });
    }

    /**
     * Auto applies a payment to oldest open invoices (FIFO)
     */
    static async autoApplyPayment(paymentOpenItemId: number, matcherUserId: string) {
        const payment = await prisma.openItem.findUnique({
            where: { id: paymentOpenItemId }
        });

        if (!payment || payment.documentType !== 'payment') throw new Error("Invalid payment open item");
        if (Number(payment.openAmount) <= 0) return []; // Already fully applied

        let remainingToApply = Number(payment.openAmount);

        // Find open invoices for this party ordered by due date ascending (FIFO)
        const openInvoices = await prisma.openItem.findMany({
            where: {
                partyId: payment.partyId,
                partyType: payment.partyType,
                documentType: 'invoice',
                openAmount: { gt: 0 },
                status: { in: ['OPEN', 'PARTIAL'] }
            },
            orderBy: { dueDate: 'asc' }
        });

        const matches = [];

        for (const invoice of openInvoices) {
            if (remainingToApply <= 0) break;

            const invOpenAmt = Number(invoice.openAmount);
            const applied = Math.min(invOpenAmt, remainingToApply);

            // Update Invoice
            await prisma.openItem.update({
                where: { id: invoice.id },
                data: {
                    openAmount: invOpenAmt - applied,
                    status: (invOpenAmt - applied) <= 0.01 ? 'CLEARED' : 'PARTIAL'
                }
            });

            remainingToApply -= applied;
            matches.push({ invoiceId: invoice.id, applied });
        }

        // Update Payment
        await prisma.openItem.update({
            where: { id: payment.id },
            data: {
                openAmount: remainingToApply,
                status: remainingToApply <= 0.01 ? 'CLEARED' : 'PARTIAL'
            }
        });

        if (matches.length > 0) {
            const matchedIds = matches.map(m => m.invoiceId).join(',') + `,${payment.id}`;
            const totalApplied = Number(payment.openAmount) - remainingToApply;

            await prisma.itemMatch.create({
                data: {
                    matcherUserId,
                    appliedAmount: totalApplied,
                    matchedItemIds: matchedIds
                }
            });
        }

        return matches;
    }
}
