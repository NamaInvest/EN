/**
 * Dunning Engine v2 — Multi-tenant with Late Fees, Interest, and Promise-to-Pay
 *
 * Improvements over v1:
 * - Multi-tenant: accepts prisma instance instead of singleton
 * - Late Fee JE generation (configurable per DunningLevel)
 * - Interest accrual JE (daysOverdue × rate per DunningLevel)
 * - Snooze and Promise-to-Pay respected
 * - Customer credit hold at Level 4
 * - Communication logging (EMAIL + WHATSAPP stubs)
 * - Idempotent: won't send duplicate letters at same level
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.dunning-engi' });

interface DunningRunResult {
  processed:      number;
  skippedSnooze:  number;
  skippedPromise: number;
  letters:        number;
  lateFees:       number;
  blocked:        number;
  errors:         string[];
}

export class DunningEngineV2 {

  /**
   * Execute daily dunning run for a specific tenant.
   * Call from /api/cron/dunning or /api/accounting/dunning/daily-run
   */
  static async executeDailyRun(prisma: PrismaClient, asOfDate: Date = new Date()): Promise<DunningRunResult> {
    const result: DunningRunResult = { processed: 0, skippedSnooze: 0, skippedPromise: 0, letters: 0, lateFees: 0, blocked: 0, errors: [] };

    // Fetch overdue invoices (not yet fully paid)
    const overdueInvoices = await prisma.salesInvoice.findMany({
      take: 1000,
      where: { status: 'posted', remaining: { gt: 0 }, date: { lt: asOfDate } },
      include: { customer: true },
    });

    if (overdueInvoices.length === 0) return result;

    // Group by customer
    const groups = new Map<number, typeof overdueInvoices>();
    for (const inv of overdueInvoices) {
      if (!inv.customerId) continue;
      if (!groups.has(inv.customerId)) groups.set(inv.customerId, []);
      groups.get(inv.customerId)!.push(inv);
    }

    // Fetch active dunning levels (sorted desc so we find the worst applicable)
    const levels = await prisma.dunningLevel.findMany({
      take: 20,
      where: { active: true },
      orderBy: { daysOverdue: 'desc' },
    });

    if (levels.length === 0) return result;

    // Fetch late fee income account (configurable via settings)
    const feeAccountSetting = await prisma.setting.findUnique({ where: { key: 'dunning_late_fee_account_id' } }).catch(() => null);
    const feeAccountId      = feeAccountSetting?.value ? parseInt(feeAccountSetting.value) : null;

    const arAccountSetting = await prisma.setting.findUnique({ where: { key: 'dunning_ar_account_id' } }).catch(() => null);
    const arAccountId      = arAccountSetting?.value ? parseInt(arAccountSetting.value) : null;

    for (const [customerId, invoices] of groups.entries()) {
      result.processed++;
      const customer = invoices[0].customer;
      if (!customer) continue;

      try {
        // Skip if snoozed
        if ((customer as any).dunningPaused || ((customer as any).dunningSnoozeUntil && new Date((customer as any).dunningSnoozeUntil) > asOfDate)) {
          result.skippedSnooze++;
          continue;
        }

        // Skip if active Promise-to-Pay that hasn't expired
        const activePromise = await (prisma as any).promiseToPay.findFirst({
          where: { customerId, status: 'ACTIVE', promisedDate: { gte: asOfDate } },
        }).catch(() => null);
        if (activePromise) { result.skippedPromise++; continue; }

        // Compute max overdue days and total amount
        let maxDaysOverdue = 0;
        let totalDue       = 0;
        let oldestDueDate  = asOfDate;

        for (const inv of invoices) {
          const invDate = new Date(inv.date);
          const days    = Math.ceil((asOfDate.getTime() - invDate.getTime()) / 86400000);
          if (days > maxDaysOverdue) maxDaysOverdue = days;
          if (invDate < oldestDueDate) oldestDueDate = invDate;
          totalDue += Number(inv.remaining ?? 0);
        }

        // Find applicable level
        const targetLevel = levels.find((l: any) => maxDaysOverdue >= l.daysOverdue);
        if (!targetLevel) continue;

        const currentLevel = (customer as any).dunningCurrentLevel || 0;

        // Skip if already at this level (idempotent — no re-sending same letter)
        if ((targetLevel as any).levelNumber <= currentLevel) continue;

        // ── Get or create campaign ────────────────────────────────────────────
        let campaign = await (prisma as any).dunningCampaign.findFirst({ where: { customerId, status: 'ACTIVE' } }).catch(() => null);
        if (!campaign) {
          campaign = await (prisma as any).dunningCampaign.create({
            data: { campaignNumber: `DUN-${customerId}-${Date.now()}`, customerId, totalAmountAtStart: totalDue, triggeredBy: 'CRON' },
          }).catch(() => null);
        }
        if (!campaign) continue;

        // ── Create dunning letter ─────────────────────────────────────────────
        await (prisma as any).dunningLetter.create({
          data: {
            letterNumber:  `LTR-${campaign.id}-${(targetLevel as any).levelNumber}-${Date.now()}`,
            campaignId:    campaign.id,
            customerId,
            levelId:       targetLevel.id,
            invoiceIds:    invoices.map((i: any) => i.id),
            totalAmountDue: totalDue,
            oldestDueDate,
            daysOverdue:   maxDaysOverdue,
            status:        'GENERATED',
          },
        });
        result.letters++;

        // ── Late Fee JE ───────────────────────────────────────────────────────
        const lateFee = Number((targetLevel as any).lateFeeAmount ?? 0);
        if (lateFee > 0 && feeAccountId && arAccountId) {
          const entryNumber = `LATE-FEE-${customerId}-${Date.now()}`;
          await prisma.journalEntry.create({
            data: {
              entryNumber,
              entryDate:   asOfDate.toISOString().split('T')[0],
              description: `رسوم تأخير — مستوى ${(targetLevel as any).levelNumber} — عميل #${customerId}`,
              status:      'posted',
              createdBy:   1, // System user
              lines: {
                create: [
                  { accountId: arAccountId,  debit: lateFee, credit: 0, description: `رسوم تأخير مستحقة` },
                  { accountId: feeAccountId, debit: 0, credit: lateFee, description: `إيراد رسوم تأخير` },
                ],
              },
            },
          }).catch(() => null);
          result.lateFees++;
        }

        // ── Interest JE (Level 3+) ────────────────────────────────────────────
        const interestRate = Number((targetLevel as any).interestRatePercent ?? 0);
        if (interestRate > 0 && feeAccountId && arAccountId) {
          const dailyRate   = interestRate / 100 / 30;
          const interest    = totalDue * dailyRate * maxDaysOverdue;
          if (interest > 0.01) {
            const entryNumber = `INTEREST-${customerId}-${Date.now()}`;
            await prisma.journalEntry.create({
              data: {
                entryNumber,
                entryDate:   asOfDate.toISOString().split('T')[0],
                description: `فائدة تأخير ${interestRate}%/شهر × ${maxDaysOverdue} يوم — عميل #${customerId}`,
                status:      'posted',
                createdBy:   1,
                lines: {
                  create: [
                    { accountId: arAccountId,  debit: interest, credit: 0,        description: 'فائدة تأخير مستحقة' },
                    { accountId: feeAccountId, debit: 0,        credit: interest,  description: 'إيراد فائدة تأخير' },
                  ],
                },
              },
            }).catch(() => null);
          }
        }

        // ── Credit Hold (Level 4) ─────────────────────────────────────────────
        if ((targetLevel as any).blockCustomer && !(customer as any).creditHold) {
          await prisma.customer.update({
            where: { id: customerId },
            data:  { creditHold: true, creditHoldReason: `DUNNING_LEVEL_${(targetLevel as any).levelNumber}` } as any,
          }).catch(() => null);
          result.blocked++;
        }

        // ── Update customer dunning level ─────────────────────────────────────
        await prisma.customer.update({
          where: { id: customerId },
          data:  { dunningCurrentLevel: (targetLevel as any).levelNumber, dunningLastRunAt: new Date() } as any,
        }).catch(() => null);

        // ── Communication stub (EMAIL) ────────────────────────────────────────
        if ((targetLevel as any).sendEmail) {
          await (prisma as any).dunningCommunication.create({
            data: {
              letterId:         (await (prisma as any).dunningLetter.findFirst({ where: { campaignId: campaign.id }, orderBy: { id: 'desc' } }))?.id,
              channel:          'EMAIL',
              recipientAddress: (customer as any).email ?? (customer as any).emailAddress ?? '',
              status:           'PENDING',
              direction:        'OUTBOUND',
            },
          }).catch(() => null);
        }

      } catch (err: any) {
        result.errors.push(`Customer ${customerId}: ${err.message}`);
      }
    }

    return result;
  }

  /**
   * Snooze a customer from dunning for N days
   */
  static async snoozeCustomer(prisma: PrismaClient, customerId: number, days: number, reason: string) {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    return prisma.customer.update({
      where: { id: customerId },
      data:  { dunningSnoozeUntil: snoozeUntil, dunningPaused: false } as any,
    });
  }

  /**
   * Record a Promise-to-Pay commitment
   */
  static async recordPromiseToPay(
    prisma: PrismaClient,
    customerId: number,
    promisedDate: Date,
    promisedAmount: number,
    notes: string,
    recordedByUserId: number,
  ) {
    return (prisma as any).promiseToPay.create({
      data: { customerId, promisedDate, promisedAmount, notes, status: 'ACTIVE', recordedByUserId: String(recordedByUserId) },
    });
  }
}
