/**
 * Delivery Note Engine (G-03)
 * ═════════════════════════════
 * 
 * - إنشاء إذن تسليم من أمر البيع
 * - تتبع الاستلام والتوقيع
 * - ربط بالفاتورة والمخزون
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.delivery-not' });
const db = (p: any) => p as any;

export class DeliveryNoteEngine {
    static async createFromSalesOrder(
        prisma: PrismaClient,
        salesOrderId: number,
        warehouseId: number
    ): Promise<any> {
        const so = await db(prisma).salesOrder?.findUnique?.({
            where: { id: salesOrderId },
            include: { lines: { include: { product: true } }, customer: true },
        });
        if (!so) throw new Error('أمر البيع غير موجود');

        const dnNumber = `DN-${Date.now().toString(36).toUpperCase()}`;
        const dn = await db(prisma).deliveryNote?.create?.({
            data: {
                number: dnNumber,
                salesOrderId: so.id,
                customerId: so.customerId,
                warehouseId,
                deliveryDate: new Date(),
                status: 'DRAFT',
                lines: {
                    create: (so.lines || []).map((line: any) => ({
                        productId: line.productId,
                        orderedQty: line.quantity,
                        deliveredQty: line.quantity,
                        tenantId: so.tenantId || '',
                    })),
                },
                tenantId: so.tenantId || '',
            },
            include: { lines: true },
        });

        return dn;
    }

    static async confirmDelivery(
        prisma: PrismaClient,
        deliveryNoteId: number,
        signature?: string,
        driverName?: string
    ): Promise<any> {
        const dn = await db(prisma).deliveryNote?.update?.({
            where: { id: deliveryNoteId },
            data: {
                status: 'DELIVERED',
                signature: signature || null,
                driverName: driverName || null,
            },
        });

        // Deduct stock
        const lines = await db(prisma).deliveryNoteLine?.findMany?.({
            where: { deliveryNoteId },
        }) ?? [];

        for (const line of lines) {
            await (prisma as any).product.update({
                where: { id: line.productId },
                data: { stockQuantity: { decrement: Number(line.deliveredQty) } },
            }).catch(() => {});
        }

        return dn;
    }

    static async createInvoiceFromDN(
        prisma: PrismaClient,
        deliveryNoteId: number
    ): Promise<any> {
        const dn = await db(prisma).deliveryNote?.findUnique?.({
            where: { id: deliveryNoteId },
            include: { lines: { include: { product: true } } },
        });
        if (!dn) throw new Error('إذن التسليم غير موجود');

        let total = 0;
        const invoiceLines = (dn.lines || []).map((line: any) => {
            const price = Number(line.product?.salePrice || line.product?.price || 0);
            const lineTotal = price * Number(line.deliveredQty);
            total += lineTotal;
            return {
                productId: line.productId,
                quantity: line.deliveredQty,
                unitPrice: price,
                total: lineTotal,
            };
        });

        const vat = Math.round(total * 0.15 * 100) / 100;
        const invoice = await (prisma as any).salesInvoice.create({
            data: {
                invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
                customerId: dn.customerId,
                invoiceDate: new Date().toISOString(),
                subtotal: total,
                tax: vat,
                total: total + vat,
                status: 'DRAFT',
                tenantId: dn.tenantId || '',
                lines: { create: invoiceLines.map((l: any) => ({ ...l, tenantId: dn.tenantId || '' })) },
            },
        });

        // Mark DN as invoiced
        await db(prisma).deliveryNote?.update?.({
            where: { id: deliveryNoteId },
            data: { status: 'INVOICED' },
        });

        return invoice;
    }

    static async list(prisma: PrismaClient, status?: string): Promise<any[]> {
        return db(prisma).deliveryNote?.findMany?.({
            where: status ? { status } : {},
            include: { customer: { select: { id: true, name: true } }, lines: true },
            orderBy: { deliveryDate: 'desc' },
            take: 100,
        }).catch(() => []) ?? [];
    }
}
