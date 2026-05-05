import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const matches = await prisma.threeWayMatch.findMany({
            include: {
                invoice: {
                    include: { supplier: true }
                },
                purchaseOrder: true,
                lines: true
            },
            orderBy: {
                matchedAt: 'desc'
            }
        });

        return NextResponse.json({ data: matches });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        // 1. Find pending PurchaseInvoices that have a PO but no ThreeWayMatch record
        const pendingInvoices = await prisma.purchaseInvoice.findMany({
            where: {
                purchaseOrderId: { not: null },
                ThreeWayMatch: null
            },
            include: {
                details: true
            }
        });

        let processed = 0;

        // Fetch tolerance policy (for simplicity we use defaults if not found)
        const policy = await prisma.tolerancePolicy.findFirst({
            where: { isActive: true }
        });

        const qtyTolerance = policy ? Number(policy.quantityTolerancePercent) : 5.0; // 5%
        const priceTolerance = policy ? Number(policy.priceTolerancePercent) : 2.0; // 2%

        for (const invoice of pendingInvoices) {
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: invoice.purchaseOrderId! },
                include: { details: true }
            });

            if (!po) continue;

            const grns = await prisma.goodsReceiptNote.findMany({
                where: { orderId: po.id },
                include: { details: true }
            });

            // Aggregate GRN Quantities
            const grnQtyMap: Record<number, number> = {};
            grns.forEach(grn => {
                grn.details.forEach(d => {
                    grnQtyMap[d.productId] = (grnQtyMap[d.productId] || 0) + d.acceptedQty;
                });
            });

            // Aggregate PO Quantities/Prices
            const poQtyMap: Record<number, number> = {};
            const poPriceMap: Record<number, number> = {};
            po.details.forEach(d => {
                poQtyMap[d.productId] = (poQtyMap[d.productId] || 0) + d.quantity;
                poPriceMap[d.productId] = d.price; // assuming simple flat price for product in PO
            });

            let poTotalAmt = 0;
            let poTotalQty = 0;
            let grnTotalAmt = 0; // approximate using PO prices
            let grnTotalQty = 0;
            let invTotalAmt = 0;
            let invTotalQty = 0;

            let allQtyMatched = true;
            let allPriceMatched = true;

            const matchLines = [];

            for (const d of invoice.details) {
                const poQty = poQtyMap[d.productId] || 0;
                const poPrice = poPriceMap[d.productId] || 0;
                const grnQty = grnQtyMap[d.productId] || 0;
                
                const invQty = d.quantity;
                const invPrice = d.price;

                poTotalAmt += poQty * poPrice;
                poTotalQty += poQty;
                grnTotalAmt += grnQty * poPrice;
                grnTotalQty += grnQty;
                invTotalAmt += invQty * invPrice;
                invTotalQty += invQty;

                const qtyVariancePct = grnQty > 0 ? Math.abs((invQty - grnQty) / grnQty) * 100 : (invQty > 0 ? 100 : 0);
                const priceVariancePct = poPrice > 0 ? Math.abs((invPrice - poPrice) / poPrice) * 100 : (invPrice > 0 ? 100 : 0);

                const qtyMatched = qtyVariancePct <= qtyTolerance;
                const priceMatched = priceVariancePct <= priceTolerance;

                if (!qtyMatched) allQtyMatched = false;
                if (!priceMatched) allPriceMatched = false;

                matchLines.push({
                    productId: d.productId,
                    poQuantity: poQty,
                    poUnitPrice: poPrice,
                    grnQuantity: grnQty,
                    invoiceQuantity: invQty,
                    invoiceUnitPrice: invPrice,
                    priceMatched,
                    qtyMatched
                });
            }

            const totalQtyVariancePct = grnTotalQty > 0 ? Math.abs((invTotalQty - grnTotalQty) / grnTotalQty) * 100 : 0;
            const totalPriceVariancePct = poTotalAmt > 0 ? Math.abs((invTotalAmt - poTotalAmt) / poTotalAmt) * 100 : 0;

            let status = 'MATCHED';
            let paymentBlocked = false;

            if (!allQtyMatched && !allPriceMatched) {
                status = 'BOTH_HOLD';
                paymentBlocked = true;
            } else if (!allQtyMatched) {
                status = 'QTY_HOLD';
                paymentBlocked = true;
            } else if (!allPriceMatched) {
                status = 'PRICE_HOLD';
                paymentBlocked = true;
            }

            await prisma.$transaction([
                prisma.threeWayMatch.create({
                    data: {
                        invoiceId: invoice.id,
                        purchaseOrderId: po.id,
                        poTotalAmount: poTotalAmt,
                        poTotalQuantity: poTotalQty,
                        grnTotalAmount: grnTotalAmt,
                        grnTotalQuantity: grnTotalQty,
                        invoiceTotalAmount: invTotalAmt,
                        invoiceTotalQuantity: invTotalQty,
                        priceVariance: Math.abs(invTotalAmt - poTotalAmt),
                        priceVariancePercent: totalPriceVariancePct,
                        quantityVariance: Math.abs(invTotalQty - grnTotalQty),
                        quantityVariancePercent: totalQtyVariancePct,
                        priceTolerancePercent: priceTolerance,
                        quantityTolerancePercent: qtyTolerance,
                        matchStatus: status,
                        isWithinTolerance: status === 'MATCHED',
                        paymentBlocked,
                        lines: {
                            create: matchLines
                        }
                    }
                }),
                ...(status === 'MATCHED' ? [
                    prisma.purchaseInvoice.update({
                        where: { id: invoice.id },
                        data: { status: 'APPROVED_FOR_PAYMENT' }
                    })
                ] : [])
            ]);

            processed++;
        }

        return NextResponse.json({ success: true, processed });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
