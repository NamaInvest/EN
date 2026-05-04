import { prisma } from './prisma';

export class QuoteEngine {
    
    /**
     * Revise Quote: marks current as SUPERSEDED, creates a new version
     */
    static async reviseQuote(quoteId: number, changes: string, userId?: number) {
        return prisma.$transaction(async (tx: any) => {
            const currentQuote = await tx.priceQuote.findUnique({
                where: { id: quoteId },
                include: { details: true }
            });

            if (!currentQuote) throw new Error("Quote not found");
            if (['CONVERTED', 'SUPERSEDED'].includes(currentQuote.status)) {
                throw new Error("Cannot revise a quote that is already " + currentQuote.status);
            }

            // Mark current as SUPERSEDED
            await tx.priceQuote.update({
                where: { id: quoteId },
                data: { status: 'SUPERSEDED' }
            });

            // Create revision log
            await tx.quoteRevision.create({
                data: {
                    quoteId,
                    version: currentQuote.versionNumber,
                    changes,
                    revisedBy: userId
                }
            });

            // Create new version
            const newQuote = await tx.priceQuote.create({
                data: {
                    quoteNo: currentQuote.quoteNo, // Keep same quote number
                    versionNumber: currentQuote.versionNumber + 1,
                    parentQuoteId: quoteId,
                    customerId: currentQuote.customerId,
                    total: currentQuote.total,
                    status: 'DRAFT',
                    userId: currentQuote.userId,
                    notes: currentQuote.notes,
                    details: {
                        create: currentQuote.details.map((d: any) => ({
                            productId: d.productId,
                            productName: d.productName,
                            quantity: d.quantity,
                            price: d.price,
                            total: d.total
                        }))
                    }
                },
                include: { details: true }
            });

            return newQuote;
        });
    }

    /**
     * Accept Quote
     */
    static async acceptQuote(quoteId: number) {
        return prisma.priceQuote.update({
            where: { id: quoteId },
            data: { status: 'ACCEPTED' }
        });
    }

    /**
     * Reject Quote
     */
    static async rejectQuote(quoteId: number) {
        return prisma.priceQuote.update({
            where: { id: quoteId },
            data: { status: 'REJECTED' }
        });
    }

    /**
     * Convert to Sales Order
     */
    static async convertToSalesOrder(quoteId: number) {
        return prisma.$transaction(async (tx: any) => {
            const quote = await tx.priceQuote.findUnique({
                where: { id: quoteId },
                include: { details: true }
            });

            if (!quote) throw new Error("Quote not found");
            if (quote.status !== 'ACCEPTED') throw new Error("Quote must be ACCEPTED to convert");
            if (quote.convertedToSalesOrderId) throw new Error("Already converted");

            // Assuming a SalesOrder model exists
            // In Namasoft, it might be SalesInvoice with docType = 'order' or similar, but let's mock the creation
            // if a true SalesOrder model exists, otherwise map to SalesInvoice. We will use SalesInvoice with docType = 'order'.
            const so = await tx.salesInvoice.create({
                data: {
                    invoiceNo: Math.floor(Math.random() * 1000000),
                    date: new Date(),
                    customerId: quote.customerId,
                    subtotal: quote.total,
                    taxValue: quote.total * 0.15,
                    total: quote.total * 1.15,
                    status: 'draft',
                    notes: 'Converted from Quote ' + quote.quoteNo + ' v' + quote.versionNumber,
                    docType: 'sales_order', // Custom extension or standard behavior
                    details: {
                        create: quote.details.map((d: any) => ({
                            productId: d.productId,
                            quantity: d.quantity,
                            price: d.price,
                            total: d.total
                        }))
                    }
                }
            });

            await tx.priceQuote.update({
                where: { id: quoteId },
                data: { 
                    status: 'CONVERTED', 
                    convertedToSalesOrderId: so.id,
                    convertedAt: new Date()
                }
            });

            return so;
        });
    }
}
