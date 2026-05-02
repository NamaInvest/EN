// @ts-nocheck
import { PrismaClient, ThreeWayMatch, TolerancePolicy, PurchaseInvoice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class ThreeWayMatchEngine {
    static async match(invoiceId: number, purchaseOrderId: number): Promise<ThreeWayMatch> {
        // 1. Get the invoice and its details
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { details: true, supplier: true }
        });

        if (!invoice) throw new Error("Invoice not found");

        // 2. Get the Purchase Order
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            include: { details: true }
        });

        if (!po) throw new Error("Purchase Order not found");

        // 3. Get all GRNs for this PO
        const grns = await prisma.goodsReceiptNote.findMany({
            where: { orderId: po.id },
            include: { details: true }
        });

        // Calculate Totals
        const poTotalAmount = Number(po.total);
        const poTotalQuantity = po.details.reduce((sum: number, d: any) => sum + Number(d.quantity), 0);
        
        const invoiceTotalAmount = Number(invoice.total);
        const invoiceTotalQuantity = invoice.details.reduce((sum: number, d: any) => sum + Number(d.quantity), 0);

        let grnTotalAmount = 0;
        let grnTotalQuantity = 0;
        grns.forEach((grn: any) => {
            grn.details.forEach((detail: any) => {
                grnTotalQuantity += Number(detail.acceptedQty || detail.quantity || 0);
                // GRN amount estimation based on PO price (for basic variance)
                const poLine = po.details.find((p: any) => p.productId === detail.productId);
                if (poLine) {
                    grnTotalAmount += Number(detail.acceptedQty || detail.quantity || 0) * Number(poLine.price);
                }
            });
        });

        // 4. Calculate Variances
        const priceVariance = Math.abs(invoiceTotalAmount - poTotalAmount);
        const priceVariancePercent = poTotalAmount > 0 ? (priceVariance / poTotalAmount) * 100 : 0;
        
        const quantityVariance = Math.abs(invoiceTotalQuantity - grnTotalQuantity);
        const quantityVariancePercent = grnTotalQuantity > 0 ? (quantityVariance / grnTotalQuantity) * 100 : 0;

        // 5. Get Tolerances
        const tolerance = await this.getApplicableTolerance(invoice.supplierId || 0, invoiceTotalAmount);
        
        const isPriceOk = priceVariancePercent <= Number(tolerance.priceTolerancePercent) || priceVariance <= Number(tolerance.amountToleranceAbs);
        const isQtyOk = quantityVariancePercent <= Number(tolerance.quantityTolerancePercent);

        let matchStatus = 'MATCHED';
        if (!isPriceOk && !isQtyOk) matchStatus = 'BOTH_HOLD';
        else if (!isPriceOk) matchStatus = 'PRICE_HOLD';
        else if (!isQtyOk) matchStatus = 'QTY_HOLD';

        // 6. Save Match Record
        const matchRecord = await prisma.threeWayMatch.create({
            data: {
                invoiceId: invoice.id,
                purchaseOrderId: po.id,
                poTotalAmount,
                poTotalQuantity,
                grnTotalAmount,
                grnTotalQuantity,
                invoiceTotalAmount,
                invoiceTotalQuantity,
                priceVariance,
                priceVariancePercent,
                quantityVariance,
                quantityVariancePercent,
                priceTolerancePercent: Number(tolerance.priceTolerancePercent),
                quantityTolerancePercent: Number(tolerance.quantityTolerancePercent),
                matchStatus,
                isWithinTolerance: matchStatus === 'MATCHED',
                paymentBlocked: matchStatus !== 'MATCHED'
            }
        });

        // 7. Update Invoice Status if blocked
        if (matchStatus !== 'MATCHED') {
            await prisma.purchaseInvoice.update({
                where: { id: invoice.id },
                data: { status: 'ON_HOLD' } // Assumes status enum allows ON_HOLD
            });
        }

        return matchRecord;
    }
    
    static async resolveHold(matchId: number, action: 'APPROVE' | 'REJECT', userId: number, notes: string): Promise<void> {
        const match = await prisma.threeWayMatch.findUnique({ where: { id: matchId } });
        if (!match) throw new Error("Match record not found");

        await prisma.threeWayMatch.update({
            where: { id: matchId },
            data: {
                matchStatus: action === 'APPROVE' ? 'MATCHED' : 'MANUAL_REVIEW',
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolutionNotes: notes,
                paymentBlocked: action === 'REJECT'
            }
        });

        if (action === 'APPROVE') {
            // Unblock invoice
            await prisma.purchaseInvoice.update({
                where: { id: match.invoiceId },
                data: { status: 'completed' } // completed is the valid status for PurchaseInvoice
            });
        }
    }
    
    static async getApplicableTolerance(supplierId: number, amount: number): Promise<TolerancePolicy> {
        // Find most specific active tolerance
        const policies = await prisma.tolerancePolicy.findMany({
            where: { isActive: true }
        });
        
        if (policies.length > 0) {
            return policies[0]; // Simplified: just returns the first active one for now
        }
        
        // Default strict tolerance if no policies exist
        return {
            id: 0,
            name: 'Default Strict',
            appliesTo: 'ALL',
            priceTolerancePercent: new Decimal(0),
            quantityTolerancePercent: new Decimal(0),
            amountToleranceAbs: new Decimal(0),
            isActive: true
        } as unknown as TolerancePolicy;
    }
}
