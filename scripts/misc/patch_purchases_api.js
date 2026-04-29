const fs = require('fs');

let c = fs.readFileSync('src/app/api/purchases/route.ts', 'utf8');

// Subtotal calculation patch
const targetSubtotal = `const items = body.items || [];
        let subtotal = 0;
        for (const item of items) { const t = (item.quantity || 1) * (item.price || 0); subtotal += t - t * ((item.discountRate || 0) / 100); }
        const taxValue = subtotal * 0.15;
        const total = subtotal + taxValue;`;

const replacementSubtotal = `const items = body.items || [];
        const isManual = body.isManual === true;
        let subtotal = isManual ? (parseFloat(body.manualSubtotal) || 0) : 0;
        
        if (!isManual) {
            for (const item of items) { const t = (item.quantity || 1) * (item.price || 0); subtotal += t - t * ((item.discountRate || 0) / 100); }
        }
        
        const taxValue = isManual ? (parseFloat(body.manualTaxValue) || 0) : subtotal * 0.15;
        const total = subtotal + taxValue;`;

c = c.replace(targetSubtotal, replacementSubtotal);

// Creation patch to add isManual and ignore prices if isManual
const targetCreate = `isManual, // Add this if needed but it's automatically handled by replace below.
                        invoiceNo, supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                    stockId: body.stockId ? parseInt(body.stockId) : 1,
                    subtotal, taxValue, total, paid, remaining,
                    supplierInvoiceNo: body.supplierInvoiceNo || null,
                    paymentType,
                    status, receiptStatus, userId, branchId, notes: body.notes || null,
                    details: {
                        create: items.map((item: Record<string, unknown>) => {
                            const qty = parseFloat(item.quantity as string) || 1;
                            const price = parseFloat(item.price as string) || 0;
                            const dRate = parseFloat(item.discountRate as string) || 0;
                            const iSub = qty * price; const dVal = iSub * (dRate / 100);
                            const afterD = iSub - dVal; const tax = afterD * 0.15;
                            return { productId: parseInt(item.productId as string), productName: item.productName || '', quantity: qty, price, discountRate: dRate, discountValue: dVal, taxRate: 15, taxValue: tax, total: afterD + tax };
                        }),
                    },`;

// Oh wait, I can just use a regex for details to inject isManual into the `data` object block securely
const targetCreationBlock = `data: {
                    invoiceNo, supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                    stockId: body.stockId ? parseInt(body.stockId) : 1,
                    subtotal, taxValue, total, paid, remaining,
                    supplierInvoiceNo: body.supplierInvoiceNo || null,
                    paymentType,
                    status, receiptStatus, userId, branchId, notes: body.notes || null,
                    details: {
                        create: items.map((item: Record<string, unknown>) => {
                            const qty = parseFloat(item.quantity as string) || 1;
                            const price = parseFloat(item.price as string) || 0;
                            const dRate = parseFloat(item.discountRate as string) || 0;
                            const iSub = qty * price; const dVal = iSub * (dRate / 100);
                            const afterD = iSub - dVal; const tax = afterD * 0.15;
                            return { productId: parseInt(item.productId as string), productName: item.productName || '', quantity: qty, price, discountRate: dRate, discountValue: dVal, taxRate: 15, taxValue: tax, total: afterD + tax };
                        }),
                    },
                },`;

const replacementCreationBlock = `data: {
                    invoiceNo, isManual, supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                    stockId: body.stockId ? parseInt(body.stockId) : 1,
                    subtotal, taxValue, total, paid, remaining,
                    supplierInvoiceNo: body.supplierInvoiceNo || null,
                    paymentType,
                    status, receiptStatus, userId, branchId, notes: body.notes || null,
                    details: {
                        create: items.map((item: Record<string, unknown>) => {
                            const qty = parseFloat(item.quantity as string) || 1;
                            let price = parseFloat(item.price as string) || 0;
                            let dRate = parseFloat(item.discountRate as string) || 0;
                            
                            // 🛑 Override for manual invoices to prevent inventory valuation disruption
                            if (isManual) { price = 0; dRate = 0; }
                            
                            const iSub = qty * price; const dVal = iSub * (dRate / 100);
                            const afterD = iSub - dVal; const tax = afterD * 0.15;
                            return { productId: parseInt(item.productId as string), productName: item.productName || '', quantity: qty, price, discountRate: dRate, discountValue: dVal, taxRate: isManual ? 0 : 15, taxValue: tax, total: afterD + tax };
                        }),
                    },
                },`;

c = c.replace(targetCreationBlock, replacementCreationBlock);

fs.writeFileSync('src/app/api/purchases/route.ts', c);
console.log('API Patched');
