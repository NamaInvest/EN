import { prisma } from './prisma';

export class InventoryEngine {

    /**
     * Checks if stock falls below reorder point and generates a replenishment suggestion
     */
    static async checkReorderLevels(productId: number, warehouseId: number) {
        const stockInfo = await prisma.productStock.findFirst({
            where: { productId, warehouseId }
        });

        const planning = await prisma.inventoryPlanning.findFirst({
            where: { productId, warehouseId }
        });

        if (!stockInfo || !planning) return null;

        const currentQty = Number(stockInfo.quantity);
        const reorderPoint = Number(planning.reorderPoint);

        if (currentQty <= reorderPoint) {
            // Need to reorder
            const deficit = Number(planning.maxStockLevel) - currentQty;
            const reorderQty = deficit > 0 ? deficit : Number(planning.minStockLevel);

            return {
                status: 'REORDER_REQUIRED',
                currentQty,
                reorderPoint,
                suggestedQty: reorderQty
            };
        }

        return { status: 'SUFFICIENT_STOCK' };
    }

    /**
     * Reserves stock for a Sales Order or Work Order
     */
    static async reserveStock(productId: number, warehouseId: number, quantity: number, documentType: string, documentId: number) {
        const stockInfo = await prisma.productStock.findFirst({
            where: { productId, warehouseId }
        });

        if (!stockInfo) throw new Error("Stock not found for this product/warehouse");

        // Calculate currently reserved stock
        const activeReservations = await prisma.stockReservation.aggregate({
            _sum: { quantity: true },
            where: { productId, warehouseId, status: 'ACTIVE' }
        });

        const reservedQty = Number(activeReservations._sum.quantity || 0);
        const availableQty = Number(stockInfo.quantity) - reservedQty;

        if (availableQty < quantity) {
            throw new Error(`Insufficient available stock. Need ${quantity}, but only ${availableQty} available (Current: ${stockInfo.quantity}, Reserved: ${reservedQty}).`);
        }

        const reservation = await prisma.stockReservation.create({
            data: {
                productId,
                warehouseId,
                quantity,
                documentType,
                documentId,
                status: 'ACTIVE'
            }
        });

        return reservation;
    }

    /**
     * Consumes reserved stock when the actual issue/delivery happens
     */
    static async consumeReservation(reservationId: number) {
        const reservation = await prisma.stockReservation.findUnique({
            where: { id: reservationId }
        });

        if (!reservation || reservation.status !== 'ACTIVE') {
            throw new Error("Invalid or inactive reservation");
        }

        // The actual stock deduction happens in normal stock movement logic.
        // We just mark the reservation as consumed here so it frees up the calculation.
        await prisma.stockReservation.update({
            where: { id: reservationId },
            data: { status: 'CONSUMED' }
        });

        return true;
    }

    /**
     * Releases (cancels) a reservation
     */
    static async releaseReservation(reservationId: number) {
        return prisma.stockReservation.update({
            where: { id: reservationId },
            data: { status: 'CANCELLED' }
        });
    }
}
