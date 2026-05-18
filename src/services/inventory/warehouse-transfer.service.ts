/**
 * Warehouse Transfer Service
 * Uses actual StockTransfer + StockTransferDetail + StockMovement models
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FinancialPeriodService } from '../accounting/financial-period.service';

export class WarehouseTransferService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a warehouse transfer request
   */
  async createTransfer(tenantId: string, data: {
    fromStockId: number;
    toStockId: number;
    items: { productId: number; quantity: number }[];
    notes?: string;
    userId?: number;
  }): Promise<number> {
    // Get next transferNo
    const last = await this.prisma.stockTransfer.findFirst({ where: { tenantId }, orderBy: { transferNo: 'desc' }, select: { transferNo: true } });
    const nextNo = (last?.transferNo ?? 0) + 1;

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNo: nextNo,
        fromStockId: data.fromStockId,
        toStockId: data.toStockId,
        date: new Date(),
        notes: data.notes,
        userId: data.userId,
        details: {
          create: data.items.map((item) => ({
            tenantId,
            productId: item.productId,
            quantity: new Decimal(item.quantity),
          })),
        },
      },
    });
    return transfer.id;
  }

  /**
   * Execute a transfer (create stock movements)
   */
  async executeTransfer(tenantId: string, transferId: number): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      const transfer = await tx.stockTransfer.findFirstOrThrow({
        where: { id: transferId, tenantId },
        include: { details: true },
      });

      // Phase 2: Period Lock Enforcement inside the transaction
      const periodService = new FinancialPeriodService(tx, { tenant: { id: tenantId } } as any);
      await periodService.requireOpenPeriod(new Date());

      for (const detail of transfer.details) {
        if (!detail.productId) continue;

        // Outbound from source
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: detail.productId,
            stockId: transfer.fromStockId ?? 1,
            type: 'transfer',
            quantity: new Decimal(-Number(detail.quantity)),
            referenceType: 'stock_transfer',
            referenceId: transferId,
            date: new Date(),
          },
        });

        // Inbound to destination
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: detail.productId,
            stockId: transfer.toStockId ?? 1,
            type: 'transfer',
            quantity: new Decimal(Number(detail.quantity)),
            referenceType: 'stock_transfer',
            referenceId: transferId,
            date: new Date(),
          },
        });
      }

      // StockTransfer has no status field — log completion via AuditLog
      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'UPDATE',
          tableName: 'stock_transfers',
          recordId: String(transferId),
          details: JSON.stringify({ executedAt: new Date(), itemCount: transfer.details.length }),
        },
      });
    });
  }

  /**
   * Get recent transfers for a warehouse
   */
  async getRecentTransfers(tenantId: string, stockId?: number, limit: number = 20): Promise<{
    id: number;
    transferNo: number;
    fromStockId: number | null;
    toStockId: number | null;
    date: Date;
    itemCount: number;
  }[]> {
    const transfers = await this.prisma.stockTransfer.findMany({
      where: {
        tenantId,
        ...(stockId ? { OR: [{ fromStockId: stockId }, { toStockId: stockId }] } : {}),
      },
      include: { details: { select: { id: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return transfers.map((t) => ({
      id: t.id,
      transferNo: t.transferNo,
      fromStockId: t.fromStockId,
      toStockId: t.toStockId,
      date: t.date,
      itemCount: t.details.length,
    }));
  }
}
