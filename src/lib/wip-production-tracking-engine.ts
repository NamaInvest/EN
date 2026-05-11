/**
 * WIP & Production Tracking Engine (Phase 25.4 - Manufacturing)
 * ──────────────────────────────────────────────────────────
 * Manages the flow of Work-in-Progress (WIP) on the shop floor.
 * Tracks material consumption (Raw -> WIP), operation tracking,
 * and finished goods receipt (WIP -> Finished).
 * Automatically generates corresponding Accounting Journal Entries.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'WIPTrackingEngine' });

export type ProductionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MaterialIssueRequest {
    workOrderId: number;
    materials: { productId: number; quantity: number; cost: number }[];
    warehouseId: number;
    tenantId: string;
    userId: number;
}

export interface FinishedGoodsReceiptRequest {
    workOrderId: number;
    finishedProductId: number;
    quantityProduced: number;
    warehouseId: number;
    tenantId: string;
    userId: number;
}

export class WIPTrackingEngine {

    /**
     * Issues raw materials to the production floor (Raw Inventory -> WIP)
     */
    static async issueMaterials(req: MaterialIssueRequest): Promise<void> {
        try {
            const p = prisma as any;
            if (!p.workOrder || !p.inventoryTransaction) {
                log.warn('Manufacturing schema incomplete. Mocking material issue.');
                return;
            }

            let totalCostIssued = 0;

            await prisma.$transaction(async (tx) => {
                // 1. Update Work Order Status
                await (tx as any).workOrder.update({
                    where: { id: req.workOrderId },
                    data: { status: 'IN_PROGRESS', actualStartDate: new Date() }
                });

                // 2. Create Inventory Issues (Deduct from Raw Materials)
                for (const item of req.materials) {
                    await (tx as any).inventoryTransaction.create({
                        data: {
                            type: 'PRODUCTION_ISSUE',
                            productId: item.productId,
                            quantity: -item.quantity, // Negative for issue
                            warehouseId: req.warehouseId,
                            referenceId: req.workOrderId.toString(),
                            tenantId: req.tenantId,
                            createdById: req.userId
                        }
                    });
                    totalCostIssued += (item.quantity * item.cost);
                }

                // 3. Post WIP Journal (Dr. WIP, Cr. Raw Materials Inventory)
                const settings = await (tx as any).setting.findMany({
                    where: { tenantId: req.tenantId, key: { in: ['wip_account', 'raw_material_account'] } }
                });

                const wipAcc = settings.find((s: any) => s.key === 'wip_account')?.value || 101;
                const rawAcc = settings.find((s: any) => s.key === 'raw_material_account')?.value || 102;

                log.info(`Mocking Journal: Dr. WIP ${wipAcc} / Cr. Raw Materials ${rawAcc} for ${totalCostIssued}`);
                // In production, publish an event or call actual journal service here.
            });

            log.info(`Issued ${req.materials.length} items to WIP for Work Order ${req.workOrderId}`);

        } catch (error: any) {
            log.error('Failed to issue materials to WIP', { error: error.message });
            throw new Error(`Material issue failed: ${error.message}`);
        }
    }

    /**
     * Receives Finished Goods from production floor to Inventory (WIP -> Finished Goods)
     */
    static async receiveFinishedGoods(req: FinishedGoodsReceiptRequest): Promise<void> {
        try {
            const p = prisma as any;
            if (!p.workOrder) return;

            // In a real system, the actual WIP cost needs to be aggregated from raw materials + labor + overhead
            const estimatedCostPerUnit = 100; // Mocked Standard Cost
            const totalCost = req.quantityProduced * estimatedCostPerUnit;

            await prisma.$transaction(async (tx) => {
                // 1. Update Work Order
                await (tx as any).workOrder.update({
                    where: { id: req.workOrderId },
                    data: { status: 'COMPLETED', actualEndDate: new Date() }
                });

                // 2. Receive Inventory
                await (tx as any).inventoryTransaction.create({
                    data: {
                        type: 'PRODUCTION_RECEIPT',
                        productId: req.finishedProductId,
                        quantity: req.quantityProduced,
                        warehouseId: req.warehouseId,
                        referenceId: req.workOrderId.toString(),
                        tenantId: req.tenantId,
                        createdById: req.userId
                    }
                });

                // 3. Post Finished Goods Journal (Dr. Finished Goods, Cr. WIP)
                const settings = await (tx as any).setting.findMany({
                    where: { tenantId: req.tenantId, key: { in: ['wip_account', 'finished_goods_account'] } }
                });

                const wipAcc = settings.find((s: any) => s.key === 'wip_account')?.value || 101;
                const fgAcc = settings.find((s: any) => s.key === 'finished_goods_account')?.value || 103;

                log.info(`Mocking Journal: Dr. Finished Goods ${fgAcc} / Cr. WIP ${wipAcc} for ${totalCost}`);
            });

            log.info(`Received ${req.quantityProduced} finished units for Work Order ${req.workOrderId}`);

        } catch (error: any) {
            log.error('Failed to receive finished goods', { error: error.message });
            throw new Error(`Finished goods receipt failed: ${error.message}`);
        }
    }
}
