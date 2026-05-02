const fs = require('fs');
let content = fs.readFileSync('src/app/api/purchases/route.ts', 'utf8');

content = content.replace(
    '        const isManual = body.isManual === true;\n        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;',
    `        const isManual = body.isManual === true;
        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;

        const purchaseOrderId = body.purchaseOrderId ? Number(body.purchaseOrderId) : null;
        let calculatedPpv = 0;
        let poTotalAmount = 0;
        let poTotalQuantity = 0;
        let invoiceTotalQuantity = 0;

        if (purchaseOrderId && !isManual) {
            const po = await (prisma.purchaseOrder as any).findUnique({
                where: { id: purchaseOrderId },
                include: { details: true }
            });
            if (po) {
                for (const item of items) {
                    const poLine = po.details.find((d) => d.productId === Number(item.productId));
                    if (poLine) {
                        const invPrice = Number(item.price) || 0;
                        const poPrice = Number(poLine.price) || 0;
                        const qty = Number(item.quantity) || 1;
                        const linePpv = (invPrice - poPrice) * qty;
                        calculatedPpv += linePpv;
                        poTotalAmount += poPrice * qty;
                        poTotalQuantity += qty;
                    }
                    invoiceTotalQuantity += Number(item.quantity) || 1;
                }
            }
        }`
);

content = content.replace(
    '                    supplierInvoiceNo: body.supplierInvoiceNo || null,\n                    paymentType,\n                    status, receiptStatus, userId, branchId, notes: body.notes || null,\n                    details: {',
    `                    supplierInvoiceNo: body.supplierInvoiceNo || null,
                    paymentType,
                    status, receiptStatus, userId, branchId, notes: body.notes || null,
                    purchaseOrderId,
                    ppvAmount: calculatedPpv,
                    details: {`
);

content = content.replace(
    `            if (paid > 0) {\n                await tx.treasury.create({\n                    data: { type: 'out', amount: paid, description: \`فاتورة مشتريات #\${invoiceNo}\`, referenceType: 'purchase', referenceId: createdInvoice.id, userId, branchId },\n                });\n            }\n\n            return createdInvoice;\n        });`,
    `            if (paid > 0) {
                await tx.treasury.create({
                    data: { type: 'out', amount: paid, description: \`فاتورة مشتريات #\${invoiceNo}\`, referenceType: 'purchase', referenceId: createdInvoice.id, userId, branchId },
                });
            }

            if (purchaseOrderId) {
                const varianceThreshold = subtotal * 0.05;
                await (tx as any).threeWayMatch.create({
                    data: {
                        invoiceId: createdInvoice.id,
                        purchaseOrderId,
                        poTotalAmount,
                        poTotalQuantity,
                        grnTotalAmount: subtotal - calculatedPpv,
                        grnTotalQuantity: invoiceTotalQuantity,
                        invoiceTotalAmount: subtotal,
                        invoiceTotalQuantity,
                        varianceAmount: calculatedPpv,
                        varianceQuantity: invoiceTotalQuantity - poTotalQuantity,
                        matchStatus: Math.abs(calculatedPpv) > varianceThreshold ? 'pending' : 'approved',
                    }
                });
            }

            return createdInvoice;
        });`
);

content = content.replace(
    `                paymentType,\n                userId: userId || undefined,\n                branchId: branchId || undefined,\n                date: new Date().toISOString().split('T')[0],\n            });`,
    `                paymentType,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
                ppvAmount: calculatedPpv,
            });`
);

// Fallback for Windows line endings
if (content === fs.readFileSync('src/app/api/purchases/route.ts', 'utf8')) {
content = content.replace(
    '        const isManual = body.isManual === true;\r\n        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;',
    `        const isManual = body.isManual === true;\r\n        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;\r\n\r\n        const purchaseOrderId = body.purchaseOrderId ? Number(body.purchaseOrderId) : null;\r\n        let calculatedPpv = 0;\r\n        let poTotalAmount = 0;\r\n        let poTotalQuantity = 0;\r\n        let invoiceTotalQuantity = 0;\r\n\r\n        if (purchaseOrderId && !isManual) {\r\n            const po = await (prisma.purchaseOrder as any).findUnique({\r\n                where: { id: purchaseOrderId },\r\n                include: { details: true }\r\n            });\r\n            if (po) {\r\n                for (const item of items) {\r\n                    const poLine = po.details.find((d) => d.productId === Number(item.productId));\r\n                    if (poLine) {\r\n                        const invPrice = Number(item.price) || 0;\r\n                        const poPrice = Number(poLine.price) || 0;\r\n                        const qty = Number(item.quantity) || 1;\r\n                        const linePpv = (invPrice - poPrice) * qty;\r\n                        calculatedPpv += linePpv;\r\n                        poTotalAmount += poPrice * qty;\r\n                        poTotalQuantity += qty;\r\n                    }\r\n                    invoiceTotalQuantity += Number(item.quantity) || 1;\r\n                }\r\n            }\r\n        }`
);

content = content.replace(
    '                    supplierInvoiceNo: body.supplierInvoiceNo || null,\r\n                    paymentType,\r\n                    status, receiptStatus, userId, branchId, notes: body.notes || null,\r\n                    details: {',
    `                    supplierInvoiceNo: body.supplierInvoiceNo || null,\r\n                    paymentType,\r\n                    status, receiptStatus, userId, branchId, notes: body.notes || null,\r\n                    purchaseOrderId,\r\n                    ppvAmount: calculatedPpv,\r\n                    details: {`
);

content = content.replace(
    `            if (paid > 0) {\r\n                await tx.treasury.create({\r\n                    data: { type: 'out', amount: paid, description: \`فاتورة مشتريات #\${invoiceNo}\`, referenceType: 'purchase', referenceId: createdInvoice.id, userId, branchId },\r\n                });\r\n            }\r\n\r\n            return createdInvoice;\r\n        });`,
    `            if (paid > 0) {\r\n                await tx.treasury.create({\r\n                    data: { type: 'out', amount: paid, description: \`فاتورة مشتريات #\${invoiceNo}\`, referenceType: 'purchase', referenceId: createdInvoice.id, userId, branchId },\r\n                });\r\n            }\r\n\r\n            if (purchaseOrderId) {\r\n                const varianceThreshold = subtotal * 0.05;\r\n                await (tx as any).threeWayMatch.create({\r\n                    data: {\r\n                        invoiceId: createdInvoice.id,\r\n                        purchaseOrderId,\r\n                        poTotalAmount,\r\n                        poTotalQuantity,\r\n                        grnTotalAmount: subtotal - calculatedPpv,\r\n                        grnTotalQuantity: invoiceTotalQuantity,\r\n                        invoiceTotalAmount: subtotal,\r\n                        invoiceTotalQuantity,\r\n                        varianceAmount: calculatedPpv,\r\n                        varianceQuantity: invoiceTotalQuantity - poTotalQuantity,\r\n                        matchStatus: Math.abs(calculatedPpv) > varianceThreshold ? 'pending' : 'approved',\r\n                    }\r\n                });\r\n            }\r\n\r\n            return createdInvoice;\r\n        });`
);

content = content.replace(
    `                paymentType,\r\n                userId: userId || undefined,\r\n                branchId: branchId || undefined,\r\n                date: new Date().toISOString().split('T')[0],\r\n            });`,
    `                paymentType,\r\n                userId: userId || undefined,\r\n                branchId: branchId || undefined,\r\n                date: new Date().toISOString().split('T')[0],\r\n                ppvAmount: calculatedPpv,\r\n            });`
);
}

fs.writeFileSync('src/app/api/purchases/route.ts', content);
console.log('Patched');
