/**
 * BadDebtService — مخصص الديون المشكوك في تحصيلها
 *
 * النماذج: OpenItem, WriteoffPolicy, JournalEntry, Customer
 *
 * IFRS 9 — نموذج الخسائر الائتمانية المتوقعة (ECL)
 *
 * مراحل التصنيف:
 *  Stage 1: أقل من 30 يوم متأخر      → مخصص 1% (احتمال خسارة منخفض)
 *  Stage 2: 30–90 يوم متأخر          → مخصص 10% (تدهور ائتماني ملحوظ)
 *  Stage 3: أكثر من 90 يوم           → مخصص 50% (مشكوك في تحصيله)
 *  Write-off: أكثر من 365 يوم        → إعدام الدين وفق سياسة WriteoffPolicy
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type ECLStage = 1 | 2 | 3;

interface ECLConfig { stage: ECLStage; daysFrom: number; daysTo: number; provisionRate: Decimal }

const ECL_STAGES: ECLConfig[] = [
  { stage: 1, daysFrom: 0,   daysTo: 29,  provisionRate: new Decimal('0.01') },
  { stage: 2, daysFrom: 30,  daysTo: 89,  provisionRate: new Decimal('0.10') },
  { stage: 3, daysFrom: 90,  daysTo: 364, provisionRate: new Decimal('0.50') },
];
const WRITEOFF_DAYS = 365;
const WRITEOFF_RATE = new Decimal('1.00'); // 100% إعدام

export interface ECLProvisionLine {
  customerId: number;
  customerName: string;
  openItemId: number;
  daysOverdue: number;
  stage: ECLStage | 'WRITEOFF';
  openAmount: Decimal;
  provisionRate: Decimal;
  provisionAmount: Decimal;
}

export interface BadDebtProvisionResult {
  asOfDate: Date;
  lines: ECLProvisionLine[];
  totalOpen: Decimal;
  totalProvision: Decimal;
  writeoffCandidates: ECLProvisionLine[];
  journalEntryId?: number;
}

export class BadDebtService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * حساب مخصص الديون المشكوك في تحصيلها (IFRS 9 ECL)
   */
  async calculateProvision(asOfDate: Date = new Date()): Promise<BadDebtProvisionResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const openItems = await prisma.openItem.findMany({
      where: { tenantId, partyType: 'customer', openAmount: { gt: 0 }, status: 'OPEN' },
      include: { customer: { select: { id: true, name: true } } },
    }).catch(() => []);

    const lines: ECLProvisionLine[] = [];

    for (const item of openItems) {
      const due = new Date(item.dueDate ?? item.documentDate);
      const daysOverdue = Math.max(0, Math.floor((asOfDate.getTime() - due.getTime()) / 86_400_000));
      const openAmount = new Decimal(item.openAmount);

      let stage: ECLStage | 'WRITEOFF';
      let provisionRate: Decimal;

      if (daysOverdue >= WRITEOFF_DAYS) {
        stage = 'WRITEOFF';
        provisionRate = WRITEOFF_RATE;
      } else {
        const config = ECL_STAGES.find((s) => daysOverdue >= s.daysFrom && daysOverdue <= s.daysTo)
          ?? ECL_STAGES[0];
        stage = config.stage;
        provisionRate = config.provisionRate;
      }

      lines.push({
        customerId: item.partyId,
        customerName: item.customer?.name ?? '',
        openItemId: item.id,
        daysOverdue,
        stage,
        openAmount,
        provisionRate,
        provisionAmount: openAmount.mul(provisionRate).toDecimalPlaces(2),
      });
    }

    const totalOpen = lines.reduce((s, l) => s.add(l.openAmount), new Decimal(0));
    const totalProvision = lines.reduce((s, l) => s.add(l.provisionAmount), new Decimal(0));
    const writeoffCandidates = lines.filter((l) => l.stage === 'WRITEOFF');

    return { asOfDate, lines, totalOpen, totalProvision, writeoffCandidates };
  }

  /**
   * ترحيل قيد مخصص الديون المشكوك في تحصيلها
   */
  async postProvision(asOfDate: Date = new Date()): Promise<{ journalEntryId: number; totalProvision: Decimal }> {
    const result = await this.calculateProvision(asOfDate);
    if (result.totalProvision.isZero()) return { journalEntryId: 0, totalProvision: new Decimal(0) };

    const prisma = this.prisma as any;
    const je = await prisma.journalEntry.create({
      data: {
        tenantId: this.ctx.tenant.id,
        reference: `ECL-PROV-${asOfDate.toISOString().slice(0, 7)}`,
        description: `مخصص الديون المشكوك في تحصيلها (IFRS 9) — ${asOfDate.toLocaleDateString('ar-SA')}`,
        date: asOfDate,
        status: 'POSTED',
        lines: {
          create: [
            { tenantId: this.ctx.tenant.id, accountCode: 'BAD_DEBT_EXPENSE', debit: result.totalProvision, credit: new Decimal(0), description: 'مصروف الديون المشكوك فيها' },
            { tenantId: this.ctx.tenant.id, accountCode: 'ALLOWANCE_FOR_BAD_DEBT', debit: new Decimal(0), credit: result.totalProvision, description: 'مخصص الديون المشكوك فيها' },
          ],
        },
      },
    });

    return { journalEntryId: je.id, totalProvision: result.totalProvision };
  }

  /**
   * إعدام الديون المنتهية (Write-off) تلقائياً
   */
  async writeoffExpired(asOfDate: Date = new Date()): Promise<{ writtenOff: number; amount: Decimal }> {
    const provision = await this.calculateProvision(asOfDate);
    if (provision.writeoffCandidates.length === 0) return { writtenOff: 0, amount: new Decimal(0) };

    const prisma = this.prisma as any;
    let totalWrittenOff = new Decimal(0);

    await prisma.$transaction(async (tx: any) => {
      for (const candidate of provision.writeoffCandidates) {
        await tx.openItem.update({
          where: { id: candidate.openItemId },
          data: { status: 'WRITTEN_OFF', openAmount: new Decimal(0) },
        });
        totalWrittenOff = totalWrittenOff.add(candidate.openAmount);
      }
    });

    return { writtenOff: provision.writeoffCandidates.length, amount: totalWrittenOff };
  }
}
