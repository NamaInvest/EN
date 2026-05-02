const fs = require('fs');
let code = fs.readFileSync('src/app/api/purchases/grn/route.ts', 'utf8');

code = code.replace(
    /const newGrn = await tx\.goodsReceiptNote\.create\(\{[\s\S]*?\}\);/m,
    `const newGrn = await tx.goodsReceiptNote.create({
                data: {
                    grnNo: nextNo,
                    supplierId: supplierId ? parseInt(supplierId) : null,
                    orderId: orderId ? parseInt(orderId) : null,
                    stockId: stockId ? parseInt(stockId) : 1,
                    notes,
                    receivedBy: decoded.userId,
                    status: 'pending_qc'
                },
            });`
);

const loopPattern = `            for (const item of items) {
                const accepted = parseFloat(item.acceptedQty) || parseFloat(item.quantity);
                if (accepted > 0) {
                    const productObj = await tx.product.findUnique({ where: { id: parseInt(item.productId) } });
                    totalGrnCost += accepted * (productObj?.buyPrice || 0);

                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { increment: accepted } },
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            stockId: stockId ? parseInt(stockId) : 1,
                            type: 'in',
                            quantity: accepted,
                            referenceType: 'GRN',
                            referenceId: newGrn.id,
                            userId: decoded.userId,
                            notes: 'استلام بضاعة سند إدخال رقم ' + nextNo,
                        },
                    });`;

const newLoop = `            for (const item of items) {
                const accepted = parseFloat(item.acceptedQty) || parseFloat(item.quantity);
                const rejected = parseFloat(item.rejectedQty) || 0;
                const productObj = await tx.product.findUnique({ where: { id: parseInt(item.productId) } });
                
                let createdBatchId = null;
                if (item.batchNumber && accepted > 0) {
                    const batch = await tx.productBatch.create({
                        data: {
                            productId: parseInt(item.productId),
                            batchNumber: item.batchNumber,
                            productionDate: item.productionDate ? new Date(item.productionDate) : null,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                            initialQuantity: accepted,
                            currentQuantity: accepted,
                            unitCost: productObj?.buyPrice || 0
                        }
                    });
                    createdBatchId = batch.id;
                }

                await tx.goodsReceiptNoteDetail.create({
                    data: {
                        grnId: newGrn.id,
                        productId: parseInt(item.productId),
                        productName: item.productName,
                        quantity: parseFloat(item.quantity),
                        acceptedQty: accepted,
                        rejectedQty: rejected,
                        batchId: createdBatchId
                    }
                });

                if (accepted > 0) {
                    totalGrnCost += accepted * (productObj?.buyPrice || 0);

                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { increment: accepted } },
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            stockId: stockId ? parseInt(stockId) : 1,
                            type: 'in',
                            quantity: accepted,
                            referenceType: 'GRN',
                            referenceId: newGrn.id,
                            userId: decoded.userId,
                            notes: 'استلام بضاعة سند إدخال رقم ' + nextNo,
                            batchId: createdBatchId
                        },
                    });`;

code = code.replace(loopPattern, newLoop);
fs.writeFileSync('src/app/api/purchases/grn/route.ts', code);
console.log('patched grn route');
