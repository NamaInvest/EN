// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class ThreeWayMatchEngine {
    static async match(invoiceId: number, purchaseOrderId: number) {
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
                const poLine = po.details.find((p: any) => p.productId === detail.productId);
                if (poLine) {
                    grnTotalAmount += Number(detail.acceptedQty || detail.quantity || 0) * Number(poLine.price);
                }
            });
        });

        // 4. Calculate Variances
        const priceDiff = Math.abs(invoiceTotalAmount - poTotalAmount);
        const priceVariancePercent = poTotalAmount > 0 ? (priceDiff / poTotalAmount) * 100 : 0;
        
        const qtyDiff = Math.abs(invoiceTotalQuantity - grnTotalQuantity);
        const quantityVariancePercent = grnTotalQuantity > 0 ? (qtyDiff / grnTotalQuantity) * 100 : 0;

        const totalDiff = priceDiff;

        // 5. Get Tolerances
        const tolerance = await this.getApplicableTolerance(invoice.supplierId || 0);
        
        const isPriceOk = priceVariancePercent <= Number(tolerance.priceTolerancePct) || priceDiff <= Number(tolerance.totalToleranceFlat);
        const isQtyOk = quantityVariancePercent <= Number(tolerance.qtyTolerancePct);

        let status = 'MATCHED';
        if (!isPriceOk && !isQtyOk) status = 'HOLD_TOTAL';
        else if (!isPriceOk) status = 'HOLD_PRICE';
        else if (!isQtyOk) status = 'HOLD_QTY';

        // 6. Save Match Record
        const matchRecord = await prisma.invoiceMatchResult.create({
            data: {
                invoiceId: invoice.id,
                status,
                priceDiff,
                qtyDiff,
                totalDiff
            }
        });

        // 7. Update Invoice Status if blocked
        if (status !== 'MATCHED') {
            await prisma.purchaseInvoice.update({
                where: { id: invoice.id },
                data: { status: 'ON_HOLD' } // Assumes status enum allows ON_HOLD
            });
        }

        return matchRecord;
    }
    
    static async resolveHold(matchId: number, action: 'APPROVE' | 'REJECT', userId: string, notes: string) {
        const match = await prisma.invoiceMatchResult.findUnique({ where: { id: matchId } });
        if (!match) throw new Error("Match record not found");

        await prisma.invoiceMatchResult.update({
            where: { id: matchId },
            data: {
                status: action === 'APPROVE' ? 'MATCHED' : 'MANUAL_REVIEW',
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolution: notes
            }
        });

        if (action === 'APPROVE') {
            // Unblock invoice
            await prisma.purchaseInvoice.update({
                where: { id: match.invoiceId },
                data: { status: 'completed' }
            });
        }
    }
    
    static async getApplicableTolerance(supplierId: number) {
        // Find most specific active tolerance
        const policies = await prisma.tolerancePolicy.findMany();
        
        if (policies.length > 0) {
            return policies[0]; 
        }
        
        // Default strict tolerance if no policies exist
        return {
            id: 0,
            name: 'Default Strict',
            applicableTo: 'DEFAULT',
            priceTolerancePct: 0,
            qtyTolerancePct: 0,
            totalToleranceFlat: 0,
            action: 'MANUAL'
        };
    }
}
