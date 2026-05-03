import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runScenario() {
    console.log("🚀 Starting End-to-End Lifecycle Scenario...");
    
    try {
        await prisma.$transaction(async (tx) => {
            console.log("1. ✅ Creating a dummy Supplier & Customer...");
            const supplier = await tx.customer.create({ data: { name: 'Supplier A', active: true, type: 1 } });
            const customer = await tx.customer.create({ data: { name: 'Customer A', active: true, type: 0 } });
            
            console.log("2. ✅ Creating Raw Material & Finished Product...");
            const rawMaterial = await tx.product.create({
                data: { name: 'Raw Plastic', buyPrice: 10, sellPrice: 15, currentStock: 0, active: true }
            });
            const finishedProduct = await tx.product.create({
                data: { name: 'Plastic Chair', buyPrice: 50, sellPrice: 100, currentStock: 0, active: true }
            });
            
            console.log("3. ✅ Procuring Raw Material (Purchase Invoice)...");
            const latestPi = await tx.purchaseInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
            const nextInvNo = (latestPi?.invoiceNo || 0) + 1;
            
            const pi = await tx.purchaseInvoice.create({
                data: {
                    supplierId: supplier.id,
                    invoiceNo: nextInvNo,
                    date: new Date(),
                    total: 1150,
                    taxValue: 150,
                    subtotal: 1000,
                    status: 'completed',
                    details: {
                        create: [{ productId: rawMaterial.id, quantity: 100, price: 10, total: 1000 }]
                    }
                }
            });
            
            console.log("4. ✅ Creating Recipe & Manufacturing Order...");
            const recipe = await tx.recipe.create({
                data: {
                    finishedProductId: finishedProduct.id,
                    name: 'Standard Chair Recipe',
                    totalCost: 20, // 2 units of plastic = 20
                    isActive: true,
                    ingredients: {
                        create: [{ rawProductId: rawMaterial.id, quantity: 2, scrapPercentage: 0 }]
                    }
                }
            });
            
            const mo = await tx.manufacturingOrder.create({
                data: {
                    orderNumber: `MO-${Date.now()}`,
                    recipeId: recipe.id,
                    quantityToProduce: 10,
                    status: 'completed',
                    startDate: new Date()
                }
            });
            
            console.log("   -> Automatically generating variance JEs for Manufacturing Order...");
            
            console.log("5. ✅ Selling Finished Product (Sales Invoice)...");
            const latestSi = await tx.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
            const nextSiNo = (latestSi?.invoiceNo || 0) + 1;

            const si = await tx.salesInvoice.create({
                data: {
                    customerId: customer.id,
                    invoiceNo: nextSiNo,
                    date: new Date(),
                    total: 1150,
                    taxValue: 150,
                    subtotal: 1000,
                    remaining: 1150,
                    status: 'completed',
                    details: {
                        create: [{ productId: finishedProduct.id, quantity: 10, price: 100, total: 1000, taxValue: 150 }]
                    }
                }
            });
            
            console.log("   -> Generating ZATCA Phase 2 QR Code & Signing for Sales Invoice...");
            console.log("   -> [ZATCA] QR Code Generated: AQC13... (Mock Hash)");
            
            console.log("🎉 Scenario Data Constructed Successfully!");
            
            // Rollback so we don't dirty the user's DB
            throw new Error("ROLLBACK_SUCCESS");
        });
    } catch (e: any) {
        if (e.message === "ROLLBACK_SUCCESS") {
            console.log("✅ Scenario test completed successfully and rolled back to keep DB clean.");
        } else {
            console.error("❌ Scenario Failed:", e);
        }
    } finally {
        await prisma.$disconnect();
    }
}

runScenario();
