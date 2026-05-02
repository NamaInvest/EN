import { prisma } from './prisma';

export class SubcontractingEngine {

    /**
     * Issue raw materials to subcontractor
     */
    static async issueMaterials(poId: number, productId: number, qty: number, userId: string) {
        const po = await prisma.subcontractingPO.findUnique({
            where: { id: poId }
        });

        if (!po) throw new Error("Subcontracting PO not found");
        if (po.status === 'COMPLETED') throw new Error("PO is already completed");

        return prisma.$transaction(async (tx) => {
            // Create movement record
            const movement = await tx.subcontractMovement.create({
                data: {
                    scPoId: poId,
                    type: 'ISSUE',
                    productId,
                    qty
                }
            });

            // Update Stock (Deduct from main warehouse, hypothetically add to Subcontractor warehouse)
            // For simplicity, we just deduct from stock ID 1
            await tx.productStock.updateMany({
                where: { productId, stockId: 1 },
                data: {
                    quantity: { decrement: qty }
                }
            });

            // Financial Entry: Cr Inventory, Dr WIP (Subcontracting)
            // Find standard cost
            const stdCost = await tx.standardCostVersion.findFirst({
                where: { productId, isActive: true }
            });

            if (stdCost) {
                const totalCost = stdCost.totalStdCost * qty;

                const je = await tx.journalEntry.create({
                    data: {
                        entryNumber: `SC-ISSUE-${movement.id}`,
                        entryDate: new Date().toISOString(),
                        description: `Materials issued to subcontractor for PO ${poId}`,
                        status: 'posted',
                        totalDebit: totalCost,
                        totalCredit: totalCost,
                        createdBy: parseInt(userId, 10)
                    }
                });

                await tx.journalLine.create({
                    data: {
                        entryId: je.id,
                        accountId: 1050, // Mock WIP Account
                        debit: totalCost,
                        credit: 0,
                        description: 'WIP - Subcontracting'
                    }
                });

                await tx.journalLine.create({
                    data: {
                        entryId: je.id,
                        accountId: 1040, // Mock Raw Materials Account
                        debit: 0,
                        credit: totalCost,
                        description: 'Inventory Out'
                    }
                });
            }

            // Update PO Status
            if (po.status === 'DRAFT') {
                await tx.subcontractingPO.update({
                    where: { id: poId },
                    data: { status: 'ISSUED' }
                });
            }

            return movement;
        });
    }

    /**
     * Receive Finished Goods from subcontractor
     */
    static async receiveFinishedGoods(poId: number, qtyReceived: number, userId: string) {
        const po = await prisma.subcontractingPO.findUnique({
            where: { id: poId }
        });

        if (!po) throw new Error("Subcontracting PO not found");

        return prisma.$transaction(async (tx) => {
            // Create movement record
            const movement = await tx.subcontractMovement.create({
                data: {
                    scPoId: poId,
                    type: 'RECEIVE_FINISHED',
                    productId: po.productToReceive,
                    qty: qtyReceived
                }
            });

            // Add finished product to inventory
            await tx.productStock.updateMany({
                where: { productId: po.productToReceive, stockId: 1 },
                data: {
                    quantity: { increment: qtyReceived }
                }
            });

            // Update PO Status
            await tx.subcontractingPO.update({
                where: { id: poId },
                data: { status: 'COMPLETED' }
            });

            // Note: The subcontractor service cost invoice will be processed separately via AP.
            return movement;
        });
    }
}
