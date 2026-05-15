import { n } from '@/lib/decimal-utils';

export async function runSystemReconciliation(prisma: any) {
    const summary = { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findings: any[] = [];

    // ==========================================
    // Rule A. Completed SalesInvoice without posted JournalEntry
    // ==========================================
    const completedSales = await prisma.salesInvoice.findMany({
        where: { status: 'completed' },
        select: { id: true, invoiceNo: true }
    });
    const saleRefs = completedSales.map((i: any) => `SALE-${i.invoiceNo}`);
    const saleJournals = await prisma.journalEntry.findMany({
        where: { reference: { in: saleRefs }, status: 'posted' },
        select: { reference: true }
    });
    const saleJournalSet = new Set(saleJournals.map((j: any) => j.reference));
    
    for (const inv of completedSales) {
        if (!saleJournalSet.has(`SALE-${inv.invoiceNo}`)) {
            findings.push({
                severity: 'critical',
                entityType: 'SalesInvoice',
                entityId: inv.id,
                message: `Completed SalesInvoice #${inv.invoiceNo} has no posted JournalEntry`,
                suggestedFix: `Run auto-journal resync for SalesInvoice #${inv.invoiceNo}`
            });
            summary.critical++;
            summary.totalFindings++;
        }
    }

    // ==========================================
    // Rule B. Completed / received PurchaseInvoice without posted JournalEntry
    // ==========================================
    const completedPurchases = await prisma.purchaseInvoice.findMany({
        where: { OR: [{ status: 'completed' }, { receiptStatus: 'received' }] },
        select: { id: true, invoiceNo: true }
    });
    const purRefs = completedPurchases.map((i: any) => `PUR-${i.invoiceNo}`);
    const purJournals = await prisma.journalEntry.findMany({
        where: { reference: { in: purRefs }, status: 'posted' },
        select: { reference: true }
    });
    const purJournalSet = new Set(purJournals.map((j: any) => j.reference));
    
    for (const inv of completedPurchases) {
        if (!purJournalSet.has(`PUR-${inv.invoiceNo}`)) {
            findings.push({
                severity: 'critical',
                entityType: 'PurchaseInvoice',
                entityId: inv.id,
                message: `Completed/Received PurchaseInvoice #${inv.invoiceNo} has no posted JournalEntry`,
                suggestedFix: `Run auto-journal resync for PurchaseInvoice #${inv.invoiceNo}`
            });
            summary.critical++;
            summary.totalFindings++;
        }
    }

    // ==========================================
    // Rule C. Product.currentStock mismatch with SUM(ProductStock.quantity)
    // ==========================================
    const products = await prisma.product.findMany({
        select: { id: true, name: true, currentStock: true, productStocks: { select: { quantity: true } } }
    });
    for (const prod of products) {
        let totalSubStock = 0;
        for(const st of prod.productStocks) {
             totalSubStock += n(st.quantity);
        }
        const diff = Math.abs(n(prod.currentStock) - totalSubStock);
        if (diff > 0.001) {
            findings.push({
                severity: 'high',
                entityType: 'Product',
                entityId: prod.id,
                message: `Product [${prod.name}] stock mismatch. currentStock: ${n(prod.currentStock)}, SUM(ProductStock): ${totalSubStock}`,
                suggestedFix: `Run stock reconciliation job for Product ID ${prod.id}`
            });
            summary.high++;
            summary.totalFindings++;
        }
    }

    // ==========================================
    // Rule D. POS cash/bank/split sales without Treasury
    // ==========================================
    const paidSales = await prisma.salesInvoice.findMany({
        where: { status: 'completed', paymentType: { in: ['cash', 'bank', 'split'] } },
        select: { id: true, invoiceNo: true }
    });
    if (paidSales.length > 0) {
        const paidSaleIds = paidSales.map((i: any) => i.id);
        const relatedTreasury = await prisma.treasury.findMany({
            where: { referenceType: 'sale', referenceId: { in: paidSaleIds } },
            select: { referenceId: true }
        });
        const treasurySaleSet = new Set(relatedTreasury.map((t: any) => t.referenceId));
        
        for (const inv of paidSales) {
            if (!treasurySaleSet.has(inv.id)) {
                findings.push({
                    severity: 'critical',
                    entityType: 'SalesInvoice',
                    entityId: inv.id,
                    message: `Paid SalesInvoice #${inv.invoiceNo} has no corresponding Treasury receipt`,
                    suggestedFix: `Generate missing treasury receipt for SalesInvoice #${inv.invoiceNo}`
                });
                summary.critical++;
                summary.totalFindings++;
            }
        }
    }

    return { summary, findings };
}
