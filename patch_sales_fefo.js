const fs = require('fs');
let code = fs.readFileSync('src/app/api/sales/route.ts', 'utf8');

const target1 = `                // 1. اخصم من الحبة أولاً
                await tx.product.update({
                    where: { id: productId },
                    data: { currentStock: { decrement: qtyInBase } },
                });`;

const replacement1 = `                // 1. اخصم من الحبة أولاً
                await tx.product.update({
                    where: { id: productId },
                    data: { currentStock: { decrement: qtyInBase } },
                });

                // FEFO BATCH ALLOCATION (First Expired, First Out)
                let remainingQtyToDeduct = qtyInBase;
                const batchAllocations = [];
                const availableBatches = await tx.productBatch.findMany({
                    where: { productId, currentQuantity: { gt: 0 } },
                    orderBy: [
                        { expiryDate: 'asc' }, // Sort by closest expiry
                        { id: 'asc' } // deterministic tie-breaker
                    ]
                });

                for (const batch of availableBatches) {
                    if (remainingQtyToDeduct <= 0) break;
                    
                    const deductFromBatch = Math.min(batch.currentQuantity, remainingQtyToDeduct);
                    
                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: { currentQuantity: { decrement: deductFromBatch } }
                    });

                    batchAllocations.push({ batchId: batch.id, quantity: deductFromBatch });
                    remainingQtyToDeduct -= deductFromBatch;
                }`;

code = code.replace(target1, replacement1);

const target2 = `                    // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                    await tx.stockMovement.create({
                        data: {
                            productId: productId,
                            stockId: createdInvoice.stockId,
                            type: 'out',
                            quantity: qtyInBase,
                            referenceType: 'sales_invoice',
                            referenceId: createdInvoice.id,
                            userId: userId,
                            notes: \`فاتورة مبيعات #\${invoiceNo}\`
                        }
                    });`;

const replacement2 = `                    // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                    if (batchAllocations.length > 0) {
                        for (const alloc of batchAllocations) {
                            await tx.stockMovement.create({
                                data: {
                                    productId: productId,
                                    stockId: createdInvoice.stockId,
                                    type: 'out',
                                    quantity: alloc.quantity,
                                    referenceType: 'sales_invoice',
                                    referenceId: createdInvoice.id,
                                    userId: userId,
                                    batchId: alloc.batchId,
                                    notes: \`فاتورة مبيعات #\${invoiceNo} (سحب من الدفعة)\`
                                }
                            });
                        }
                        if (remainingQtyToDeduct > 0) {
                            await tx.stockMovement.create({
                                data: {
                                    productId: productId,
                                    stockId: createdInvoice.stockId,
                                    type: 'out',
                                    quantity: remainingQtyToDeduct,
                                    referenceType: 'sales_invoice',
                                    referenceId: createdInvoice.id,
                                    userId: userId,
                                    notes: \`فاتورة مبيعات #\${invoiceNo} (سحب بدون دفعة)\`
                                }
                            });
                        }
                    } else {
                        await tx.stockMovement.create({
                            data: {
                                productId: productId,
                                stockId: createdInvoice.stockId,
                                type: 'out',
                                quantity: qtyInBase,
                                referenceType: 'sales_invoice',
                                referenceId: createdInvoice.id,
                                userId: userId,
                                notes: \`فاتورة مبيعات #\${invoiceNo}\`
                            }
                        });
                    }`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/app/api/sales/route.ts', code);
console.log('patched sales route with FEFO');
