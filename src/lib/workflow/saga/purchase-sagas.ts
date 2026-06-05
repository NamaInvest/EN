/**
 * Purchase Order Saga — 4th production saga
 * Correct model field names per schema:
 *   PurchaseOrder: supplierId (not vendorId), taxValue (not taxAmount), stockId
 *   GoodsReceiptNote: orderId (not purchaseOrderId), date (not receivedDate), receivedBy (not createdBy)
 *   GoodsReceiptNoteDetail: quantity, acceptedQty (no receivedQuantity/unitCost)
 */
import { Saga } from './coordinator';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '@/lib/logger';
import { ApprovalEngine } from '@/lib/approval-engine';

const log = logger.child({ service: 'workflow.saga.purchase-sagas' });

export interface PurchaseOrderSagaCtx {
  tenantId: string;
  userId: number;
  purchaseOrderId?: number;
  approvalRequestId?: number;
  data: {
    supplierId?: number;   // maps to PurchaseOrder.supplierId
    date: string;
    items: { productId: number; quantity: number; unitCost: number; taxRate?: number }[];
    notes?: string;
    branchId?: number;
    requireApproval?: boolean;
  };
}

export function buildPurchaseOrderSaga(prisma: PrismaClient): Saga<PurchaseOrderSagaCtx> {
  return new Saga<PurchaseOrderSagaCtx>()

    // ── Step 1: Validate supplier exists ──────────────────────────────────
    .addStep({
      name: 'validate_supplier',
      execute: async (ctx) => {
        if (ctx.data.supplierId) {
          const supplier = await prisma.customer.findFirst({
            where: { id: ctx.data.supplierId, tenantId: ctx.tenantId },
            select: { id: true, name: true },
          });
          if (!supplier) throw new Error(`Supplier ${ctx.data.supplierId} not found`);
        }
        return ctx;
      },
      compensate: async () => {},
    })

    // ── Step 2: Create Purchase Order ─────────────────────────────────────
    .addStep({
      name: 'create_purchase_order',
      execute: async (ctx) => {
        const last = await prisma.purchaseOrder.findFirst({
          where: { tenantId: ctx.tenantId },
          orderBy: { orderNo: 'desc' },
          select: { orderNo: true },
        });
        const orderNo = (last?.orderNo ?? 0) + 1;

        let subtotal = 0, taxTotal = 0;
        for (const item of ctx.data.items) {
          const lineTotal = item.quantity * item.unitCost;
          subtotal += lineTotal;
          taxTotal += lineTotal * ((item.taxRate ?? 15) / 100);
        }

        const po = await prisma.purchaseOrder.create({
          data: {
            tenantId: ctx.tenantId,
            orderNo,
            supplierId: ctx.data.supplierId,
            date: new Date(ctx.data.date),
            status: ctx.data.requireApproval ? 'pending' : 'approved',
            subtotal: new Decimal(subtotal),
            taxValue: new Decimal(taxTotal),
            total: new Decimal(subtotal + taxTotal),
            notes: ctx.data.notes,
            branchId: ctx.data.branchId,
            userId: ctx.userId,
          },
        });

        return { ...ctx, purchaseOrderId: po.id };
      },
      compensate: async (ctx) => {
        if (ctx.purchaseOrderId) {
          await prisma.purchaseOrder.update({
            where: { id: ctx.purchaseOrderId },
            data: { status: 'cancelled' },
          });
        }
      },
    })

    // ── Step 3: Submit for approval (if required) ─────────────────────────
    .addStep({
      name: 'submit_approval',
      execute: async (ctx) => {
        if (!ctx.data.requireApproval || !ctx.purchaseOrderId) return ctx;

        const po = await prisma.purchaseOrder.findUnique({
          where: { id: ctx.purchaseOrderId },
          select: { total: true }
        });
        const amount = po ? Number(po.total) : 0;

        const engine = new ApprovalEngine(prisma);
        const result = await engine.submit({
          tenantId: ctx.tenantId,
          documentType: 'PURCHASE_ORDER',
          documentId: ctx.purchaseOrderId,
          amount,
          requestedBy: ctx.userId,
          notes: ctx.data.notes,
        });

        if (result.status === 'auto_approved') {
          await prisma.purchaseOrder.update({
            where: { id: ctx.purchaseOrderId },
            data: { status: 'approved' },
          });
          return ctx;
        }

        if (result.status === 'pending_approval' && result.requestId) {
          await prisma.purchaseOrder.update({
            where: { id: ctx.purchaseOrderId },
            data: { status: 'pending' },
          });
          return { ...ctx, approvalRequestId: result.requestId };
        }

        return ctx;
      },
      compensate: async (ctx) => {
        if (ctx.approvalRequestId) {
          const engine = new ApprovalEngine(prisma);
          await engine.reject({
            tenantId: ctx.tenantId,
            requestId: ctx.approvalRequestId,
            rejectorId: ctx.userId,
            reason: 'Saga compensation: Purchase Order creation failed or rolled back',
          }).catch((err) => {
            log.error('Saga submit_approval compensation error:', err);
          });
        }
      },
    })

    // ── Step 4: Audit trail ───────────────────────────────────────────────
    .addStep({
      name: 'audit_log',
      execute: async (ctx) => {
        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            action: 'CREATE',
            tableName: 'purchase_orders',
            recordId: String(ctx.purchaseOrderId),
            userId: ctx.userId,
            details: JSON.stringify({
              via: 'PurchaseOrderSaga', items: ctx.data.items.length,
              requireApproval: ctx.data.requireApproval, approvalRequestId: ctx.approvalRequestId,
            }),
          },
        });
        return ctx;
      },
      compensate: async () => {},
    });
}

// ─── GRN (Goods Received Note) Saga ──────────────────────────────────────────

export interface GRNSagaCtx {
  tenantId: string;
  userId: number;
  purchaseOrderId: number;
  grnId?: number;
  data: {
    receivedDate: string;
    items: { productId: number; receivedQuantity: number }[];
    stockId?: number;
    notes?: string;
  };
}

export function buildGRNSaga(prisma: PrismaClient): Saga<GRNSagaCtx> {
  return new Saga<GRNSagaCtx>()

    .addStep({
      name: 'validate_po',
      execute: async (ctx) => {
        const po = await prisma.purchaseOrder.findFirstOrThrow({
          where: { id: ctx.purchaseOrderId, tenantId: ctx.tenantId },
          select: { status: true },
        });
        if (!['approved', 'partial'].includes(po.status)) {
          throw new Error(`PO ${ctx.purchaseOrderId} status '${po.status}' cannot receive goods`);
        }
        return ctx;
      },
      compensate: async () => {},
    })

    .addStep({
      name: 'create_grn',
      execute: async (ctx) => {
        const last = await prisma.goodsReceiptNote.findFirst({
          where: { tenantId: ctx.tenantId },
          orderBy: { grnNo: 'desc' },
          select: { grnNo: true },
        });
        const grnNo = (last?.grnNo ?? 0) + 1;

        const grn = await prisma.goodsReceiptNote.create({
          data: {
            tenantId: ctx.tenantId,
            grnNo,
            orderId: ctx.purchaseOrderId,
            date: new Date(ctx.data.receivedDate),
            stockId: ctx.data.stockId ?? 1,
            status: 'received',
            receivedBy: ctx.userId,
            notes: ctx.data.notes,
            details: {
              create: ctx.data.items.map((item) => ({
                tenantId: ctx.tenantId,
                productId: item.productId,
                quantity: new Decimal(item.receivedQuantity),
                acceptedQty: new Decimal(item.receivedQuantity),
              })),
            },
          },
        });

        return { ...ctx, grnId: grn.id };
      },
      compensate: async (ctx) => {
        if (ctx.grnId) {
          await prisma.goodsReceiptNote.update({ where: { id: ctx.grnId }, data: { status: 'cancelled' } });
        }
      },
    })

    .addStep({
      name: 'update_inventory',
      execute: async (ctx) => {
        for (const item of ctx.data.items) {
          await prisma.stockMovement.create({
            data: {
              tenantId: ctx.tenantId,
              productId: item.productId,
              stockId: ctx.data.stockId ?? 1,
              type: 'in',
              quantity: new Decimal(item.receivedQuantity),
              referenceType: 'grn',
              referenceId: ctx.grnId,
              date: new Date(ctx.data.receivedDate),
              userId: ctx.userId,
            },
          });
          await prisma.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.receivedQuantity } },
          });
        }
        await prisma.purchaseOrder.update({
          where: { id: ctx.purchaseOrderId },
          data: { status: 'completed' },
        });
        return ctx;
      },
      compensate: async (ctx) => {
        for (const item of ctx.data.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.receivedQuantity } },
          }).catch(() => {});
        }
      },
    })

    .addStep({
      name: 'audit_log',
      execute: async (ctx) => {
        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            action: 'CREATE',
            tableName: 'goods_receipt_notes',
            recordId: String(ctx.grnId),
            userId: ctx.userId,
            details: JSON.stringify({ purchaseOrderId: ctx.purchaseOrderId, items: ctx.data.items.length }),
          },
        });
        return ctx;
      },
      compensate: async () => {},
    });
}
