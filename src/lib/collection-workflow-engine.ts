/**
 * Collection Workflow Engine
 * ══════════════════════════════════════════════════════════════════════════════
 * محرك سير عمل التحصيل — يُتابع حالة الدفع لكل فاتورة متأخرة
 *
 * مراحل سير العمل:
 *   NEW → PROMISED → PARTIAL → ESCALATED → LEGAL → WRITTEN_OFF | COLLECTED
 *
 * ميزات:
 *   - وعود الدفع (Promise-to-Pay) مع تاريخ ومبلغ
 *   - تصعيد تلقائي إذا فات موعد الوعد
 *   - تسجيل كل نشاط في CollectionActivity
 *   - Telegram عند التصعيد القانوني
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'collection-workflow-engine' });

export type CollectionStatus =
  | 'NEW' | 'PROMISED' | 'PARTIAL' | 'ESCALATED' | 'LEGAL' | 'WRITTEN_OFF' | 'COLLECTED';

export interface PromiseToPay {
  invoiceId:    number;
  promiseDate:  Date;
  promiseAmount:number;
  notes?:       string;
}

export interface CollectionAction {
  invoiceId:    number;
  tenantId:     string;
  userId:       number;
  action:       'CALL' | 'EMAIL' | 'VISIT' | 'LEGAL_NOTICE' | 'WRITE_OFF' | 'PROMISE' | 'PAYMENT_RECEIVED';
  notes?:       string;
  amount?:      number;
  promiseDate?: Date;
}

export class CollectionWorkflowEngine {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Get current collection status ─────────────────────────────────────────
  async getStatus(tenantId: string, invoiceId: number): Promise<CollectionStatus> {
    const p = this.prisma as any;
    const inv = await p.salesInvoice?.findFirst?.({
      where: { tenantId, id: invoiceId },
      select: { collectionStatus: true, remainingAmount: true, status: true },
    }).catch(() => null);

    if (!inv) return 'NEW';
    if (Number(inv.remainingAmount ?? 0) <= 0) return 'COLLECTED';
    return (inv.collectionStatus as CollectionStatus) ?? 'NEW';
  }

  // ── Record a collection activity ───────────────────────────────────────────
  async recordActivity(action: CollectionAction): Promise<void> {
    const p = this.prisma as any;
    const now = new Date();

    await p.collectionActivity?.create?.({
      data: {
        tenantId:    action.tenantId,
        customerId:  0, // filled by caller if needed
        invoiceId:   action.invoiceId,
        type:        action.action,
        notes:       action.notes ?? null,
        dueAmount:   action.amount ?? null,
        performedAt: now,
        performedBy: String(action.userId),
      },
    }).catch(() => null);

    // Update invoice collection status
    let newStatus: CollectionStatus | null = null;
    switch (action.action) {
      case 'PROMISE':          newStatus = 'PROMISED';   break;
      case 'LEGAL_NOTICE':     newStatus = 'LEGAL';      break;
      case 'WRITE_OFF':        newStatus = 'WRITTEN_OFF'; break;
      case 'PAYMENT_RECEIVED': newStatus = 'COLLECTED';  break;
      default: break;
    }

    if (newStatus) {
      await p.salesInvoice?.update?.({
        where: { id: action.invoiceId },
        data: {
          collectionStatus: newStatus,
          ...(action.action === 'PROMISE' && action.promiseDate ? { promiseDate: action.promiseDate, promiseAmount: action.amount } : {}),
        },
      }).catch(() => null);
    }

    // Telegram for legal actions
    if (action.action === 'LEGAL_NOTICE') {
      await this.notify(
        `⚖️ *إشعار قانوني صادر*\n📄 فاتورة: ${action.invoiceId}\n💰 المبلغ: ${(action.amount ?? 0).toLocaleString('ar-SA')} ر.س`
      );
    }

    log.info('Collection activity recorded', { invoiceId: action.invoiceId, action: action.action, tenantId: action.tenantId });
  }

  // ── Record a promise to pay ────────────────────────────────────────────────
  async recordPromise(tenantId: string, ttp: PromiseToPay, userId: number): Promise<void> {
    await this.recordActivity({
      invoiceId:    ttp.invoiceId,
      tenantId,
      userId,
      action:       'PROMISE',
      notes:        ttp.notes,
      amount:       ttp.promiseAmount,
      promiseDate:  ttp.promiseDate,
    });
  }

  // ── Auto-escalate broken promises ──────────────────────────────────────────
  async escalateBrokenPromises(tenantId: string): Promise<{ escalated: number }> {
    const p   = this.prisma as any;
    const now = new Date();

    const brokenPromises = await p.salesInvoice?.findMany?.({
      where: {
        tenantId,
        collectionStatus: 'PROMISED',
        promiseDate:      { lt: now },
        remainingAmount:  { gt: 0 },
      },
      select: { id: true, remainingAmount: true, customerId: true },
    }).catch(() => []) ?? [];

    for (const inv of brokenPromises) {
      await p.salesInvoice?.update?.({
        where: { id: inv.id },
        data: { collectionStatus: 'ESCALATED' },
      }).catch(() => null);

      await p.collectionActivity?.create?.({
        data: {
          tenantId,
          customerId:  inv.customerId,
          invoiceId:   inv.id,
          type:        'ESCALATED_BROKEN_PROMISE',
          notes:       `وعد الدفع انتهى ولم يُنفَّذ — تصعيد تلقائي`,
          dueAmount:   inv.remainingAmount,
          performedAt: now,
          performedBy: 'SYSTEM',
        },
      }).catch(() => null);
    }

    if (brokenPromises.length > 0) {
      await this.notify(`🔴 *وعود دفع منتهية*\n📊 ${brokenPromises.length} فاتورة تم تصعيدها تلقائياً`);
    }

    log.info('Broken promises escalated', { tenantId, count: brokenPromises.length });
    return { escalated: brokenPromises.length };
  }

  // ── Get collection summary ─────────────────────────────────────────────────
  async getSummary(tenantId: string): Promise<{
    total: number; byStatus: Record<CollectionStatus, number>; totalOutstanding: number;
  }> {
    const p = this.prisma as any;
    const invoices = await p.salesInvoice?.findMany?.({
      where: { tenantId, remainingAmount: { gt: 0 }, status: { in: ['SENT','OVERDUE','PARTIALLY_PAID'] } },
      select: { collectionStatus: true, remainingAmount: true },
    }).catch(() => []) ?? [];

    const byStatus: Record<string, number> = {};
    let totalOutstanding = 0;

    for (const inv of invoices) {
      const s = (inv.collectionStatus as string) ?? 'NEW';
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      totalOutstanding += Number(inv.remainingAmount ?? 0);
    }

    return {
      total: invoices.length,
      byStatus: byStatus as Record<CollectionStatus, number>,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };
  }

  private async notify(text: string) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    }).catch(() => null);
  }
}
