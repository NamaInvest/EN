const fs = require('fs');
let c = fs.readFileSync('src/app/api/sales-returns/route.ts', 'utf8');

c = c.replace(
    `        const ret = await prisma.$transaction(async (tx) => {`,
    `        let generatedFeeInvoiceNo = null;
        let generatedFeeSubtotal = 0;
        let generatedFeeTax = 0;

        const ret = await prisma.$transaction(async (tx) => {`
);

c = c.replace(
    `                const feeSubtotal = restockingFee / 1.15;
                const feeTax = restockingFee - feeSubtotal;
                
                const lastSi = await tx.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
                const newSiNo = lastSi ? lastSi.invoiceNo + 1 : 1000;`,
    `                const feeSubtotal = restockingFee / 1.15;
                const feeTax = restockingFee - feeSubtotal;
                generatedFeeSubtotal = feeSubtotal;
                generatedFeeTax = feeTax;
                
                const lastSi = await tx.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
                const newSiNo = lastSi ? lastSi.invoiceNo + 1 : 1000;
                generatedFeeInvoiceNo = newSiNo;`
);

c = c.replace(
    `        try {
            const { postSalesReturn } = await import('@/lib/auto-journal');
            await postSalesReturn({
                returnNo,
                total: ret.total,
                taxValue: ret.taxValue,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr) {`,
    `        try {
            const { postSalesReturn, postSalesInvoice } = await import('@/lib/auto-journal');
            await postSalesReturn({
                returnNo,
                total: ret.total,
                taxValue: ret.taxValue,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
            });

            if (generatedFeeInvoiceNo && restockingFee > 0) {
                await postSalesInvoice({
                    invoiceNo: generatedFeeInvoiceNo,
                    subtotal: generatedFeeSubtotal,
                    taxValue: generatedFeeTax,
                    total: restockingFee,
                    paymentType: 'cash',
                    userId: userId || undefined,
                    branchId: branchId || undefined,
                    date: new Date().toISOString().split('T')[0],
                });
            }
        } catch (journalErr) {`
);

fs.writeFileSync('src/app/api/sales-returns/route.ts', c);
console.log('patched restocking fee journal');
