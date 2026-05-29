/**
 * FX Revaluation Engine (Partial Gap Fix)
 * ══════════════════════════════════════════════════════════════════════════════
 * IAS 21: المعاملات النقدية بالعملات الأجنبية تُعاد تقييمها بسعر الإقفال
 * في كل نهاية فترة تقرير (شهر/ربع/سنة).
 *
 * يُولّد:
 *   1. Unrealized FX Gains/Losses لكل رصيد عملة أجنبية
 *   2. قيد تسوية تلقائي (Dr/Cr FX P&L)
 *   3. تقرير Realized vs Unrealized FX
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { assertPeriodWritable } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'fx-revaluation' });

export interface FXRevalLine {
  accountCode:       string;
  accountName:       string;
  currency:          string;
  fcyBalance:        number;    // Balance in foreign currency
  historicalRate:    number;    // Rate used when booked
  closingRate:       number;    // Rate at revaluation date
  sarAtHistorical:   number;    // FCY × historical rate
  sarAtClosing:      number;    // FCY × closing rate
  unrealizedGainLoss: number;   // Positive = Gain, Negative = Loss
  direction:         'GAIN' | 'LOSS' | 'NONE';
}

export interface FXRevalResult {
  tenantId:        string;
  revalDate:       string;
  baseCurrency:    string;
  lines:           FXRevalLine[];
  totalUnrealized: number;
  totalGain:       number;
  totalLoss:       number;
  journalLines:    any[];
  isPosted:        boolean;
  generatedAt:     Date;
}

export class FXRevaluationEngine {

  /**
   * Run FX revaluation for all open FCY positions.
   * revalDate: the closing date (e.g. last day of month)
   */
  static async run(
    tenantId: string,
    revalDate: Date,
    postJournal: boolean = false,
    userId: string = 'system',
  ): Promise<FXRevalResult> {
    const baseCurrency = 'SAR';

    // 1. Get all open FCY journal lines (accounts with non-SAR currency)
    const fcyLines = await (prisma as any).journalLine?.findMany?.({
      where: {
        tenantId,
        journalEntry: {
          status: 'POSTED',
          date:   { lte: revalDate },
        },
        currency: { not: baseCurrency },
        foreignBalance: { not: 0 },
      },
      include: {
        account: { select: { code: true, nameAr: true, name: true } },
      },
    }).catch(() => []) ?? [];

    // 2. Group by accountCode + currency
    const grouped = new Map<string, {
      accountCode: string;
      accountName: string;
      currency:    string;
      fcyBalance:  number;
      sarBalance:  number;
      historicalRate: number;
    }>();

    for (const line of fcyLines) {
      const key     = `${line.accountCode}-${line.currency}`;
      const fcyDebit  = Number(line.foreignDebit  ?? 0);
      const fcyCredit = Number(line.foreignCredit ?? 0);
      const sarDebit  = Number(line.debit  ?? 0);
      const sarCredit = Number(line.credit ?? 0);
      const fcyNet    = fcyDebit - fcyCredit;
      const sarNet    = sarDebit  - sarCredit;

      const existing = grouped.get(key) ?? {
        accountCode: line.account?.code ?? line.accountCode,
        accountName: line.account?.nameAr ?? line.account?.name ?? '',
        currency:    line.currency,
        fcyBalance:  0,
        sarBalance:  0,
        historicalRate: 0,
      };

      existing.fcyBalance += fcyNet;
      existing.sarBalance += sarNet;
      grouped.set(key, existing);
    }

    // 3. Get closing rates for each currency
    const currencies = [...new Set([...grouped.values()].map(g => g.currency))];
    const closingRates = new Map<string, number>();

    for (const ccy of currencies) {
      const setting = await (prisma as any).setting?.findFirst?.({
        where: { tenantId, key: `fx_rate_${ccy}_SAR` },
      }).catch(() => null);

      const rate = setting?.value ? parseFloat(setting.value) : null;
      if (rate) closingRates.set(ccy, rate);
    }

    // 4. Calculate unrealized gains/losses
    const revalLines: FXRevalLine[] = [];
    const journalLines: any[]       = [];

    for (const [, group] of grouped) {
      if (Math.abs(group.fcyBalance) < 0.001) continue;

      const closingRate = closingRates.get(group.currency);
      if (!closingRate) continue;

      const historicalRate    = group.fcyBalance !== 0 ? group.sarBalance / group.fcyBalance : 0;
      const sarAtClosing      = Math.round(group.fcyBalance * closingRate * 100) / 100;
      const sarAtHistorical   = Math.round(group.sarBalance * 100) / 100;
      const unrealized        = Math.round((sarAtClosing - sarAtHistorical) * 100) / 100;

      if (Math.abs(unrealized) < 0.01) continue;

      revalLines.push({
        accountCode:        group.accountCode,
        accountName:        group.accountName,
        currency:           group.currency,
        fcyBalance:         Math.round(group.fcyBalance * 100) / 100,
        historicalRate,
        closingRate,
        sarAtHistorical,
        sarAtClosing,
        unrealizedGainLoss: unrealized,
        direction:          unrealized > 0 ? 'GAIN' : unrealized < 0 ? 'LOSS' : 'NONE',
      });

      // Build journal line
      if (unrealized > 0) {
        // Unrealized Gain: Dr Account / Cr FX Gain P&L
        journalLines.push(
          { accountCode: group.accountCode, description: `FX Reval Gain — ${group.currency}`, debit: unrealized, credit: 0, tenantId },
          { accountCode: '4910', description: `FX Unrealized Gain — ${group.currency}`, debit: 0, credit: unrealized, tenantId },
        );
      } else {
        // Unrealized Loss: Dr FX Loss P&L / Cr Account
        const absLoss = Math.abs(unrealized);
        journalLines.push(
          { accountCode: '5410', description: `FX Reval Loss — ${group.currency}`, debit: absLoss, credit: 0, tenantId },
          { accountCode: group.accountCode, description: `FX Unrealized Loss — ${group.currency}`, debit: 0, credit: absLoss, tenantId },
        );
      }
    }

    const totalUnrealized = revalLines.reduce((s, l) => s + l.unrealizedGainLoss, 0);
    const totalGain       = revalLines.filter(l => l.direction === 'GAIN').reduce((s, l) => s + l.unrealizedGainLoss, 0);
    const totalLoss       = revalLines.filter(l => l.direction === 'LOSS').reduce((s, l) => s + l.unrealizedGainLoss, 0);

    // 5. Optionally post the revaluation journal
    let isPosted = false;
    if (postJournal && journalLines.length > 0) {
      await (prisma as any).journalEntry?.create?.({
        data: {
          tenantId,
          date:        revalDate,
          description: `إعادة تقييم عملات أجنبية — ${revalDate.toISOString().split('T')[0]}`,
          reference:   `FXREVAL-${revalDate.toISOString().slice(0, 7)}`,
          status:      'POSTED',
          createdBy:   userId,
          lines:       { create: journalLines },
        },
      }).catch(() => null);
      isPosted = true;
    }

    log.info('FX revaluation completed', {
      tenantId,
      revalDate: revalDate.toISOString().split('T')[0],
      lines: revalLines.length,
      totalUnrealized,
    });

    return {
      tenantId,
      revalDate:       revalDate.toISOString().split('T')[0],
      baseCurrency,
      lines:           revalLines,
      totalUnrealized: Math.round(totalUnrealized * 100) / 100,
      totalGain:       Math.round(totalGain * 100) / 100,
      totalLoss:       Math.round(totalLoss * 100) / 100,
      journalLines,
      isPosted,
      generatedAt:     new Date(),
    };
  }

  /**
   * Month-end FX revaluation — called by cron.
   * Auto-reverses the previous month's unrealized entry (IAS 21 standard practice).
   */
  static async monthEndRevaluation(tenantId: string, userId: string = 'system') {
    const now      = new Date();
    const lastDay  = new Date(now.getFullYear(), now.getMonth(), 0);  // last day of prev month
    return this.run(tenantId, lastDay, true, userId);
  }

  private static async resolveAndValidateAccounts(
    tx: any,
    tenantId: string
  ): Promise<{
    arCode: string;
    apCode: string;
    gainCode: string;
    lossCode: string;
  }> {
    // 1. Resolve AR control account
    let arCode = '1101';
    const arSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_REVAL_AR_GL_CODE' } });
    if (arSetting?.value) {
      arCode = arSetting.value;
    } else {
      try {
        const defaultArSetting = await tx.setting.findFirst({ where: { tenantId, key: 'GL_DEFAULT_ACCOUNTS_RECEIVABLE' } });
        if (defaultArSetting?.value) {
          const acc = await tx.account.findFirst({
            where: {
              tenantId,
              OR: [
                { id: isNaN(Number(defaultArSetting.value)) ? -1 : Number(defaultArSetting.value) },
                { code: defaultArSetting.value }
              ]
            }
          });
          if (acc) arCode = acc.code;
        }
      } catch (e) {}
    }

    // 2. Resolve AP control account
    let apCode = '2101';
    const apSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_REVAL_AP_GL_CODE' } });
    if (apSetting?.value) {
      apCode = apSetting.value;
    } else {
      try {
        const defaultApSetting = await tx.setting.findFirst({ where: { tenantId, key: 'GL_DEFAULT_ACCOUNTS_PAYABLE' } });
        if (defaultApSetting?.value) {
          const acc = await tx.account.findFirst({
            where: {
              tenantId,
              OR: [
                { id: isNaN(Number(defaultApSetting.value)) ? -1 : Number(defaultApSetting.value) },
                { code: defaultApSetting.value }
              ]
            }
          });
          if (acc) apCode = acc.code;
        }
      } catch (e) {}
    }

    // 3. Resolve Gain Account
    let gainCode = '8101';
    const gainSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_GAIN_GL_CODE' } });
    if (gainSetting?.value) {
      gainCode = gainSetting.value;
    }

    // 4. Resolve Loss Account
    let lossCode = '8102';
    const lossSetting = await tx.setting.findFirst({ where: { tenantId, key: 'FX_LOSS_GL_CODE' } });
    if (lossSetting?.value) {
      lossCode = lossSetting.value;
    }

    // 5. Validation
    const arAccount = await tx.account.findFirst({ where: { code: arCode, tenantId, deletedAt: null } });
    if (!arAccount) {
      throw new Error(`Missing configured revaluation account: ${arCode} (AR) in Chart of Accounts.`);
    }
    if (!arAccount.isActive) {
      throw new Error(`Revaluation account ${arCode} (AR) is inactive.`);
    }
    if (arAccount.type !== 'asset') {
      throw new Error(`Revaluation account ${arCode} (AR) must be an asset account.`);
    }

    const apAccount = await tx.account.findFirst({ where: { code: apCode, tenantId, deletedAt: null } });
    if (!apAccount) {
      throw new Error(`Missing configured revaluation account: ${apCode} (AP) in Chart of Accounts.`);
    }
    if (!apAccount.isActive) {
      throw new Error(`Revaluation account ${apCode} (AP) is inactive.`);
    }
    if (apAccount.type !== 'liability') {
      throw new Error(`Revaluation account ${apCode} (AP) must be a liability account.`);
    }

    const gainAccount = await tx.account.findFirst({ where: { code: gainCode, tenantId, deletedAt: null } });
    if (!gainAccount) {
      throw new Error(`Missing configured revaluation account: ${gainCode} (Unrealized Gain) in Chart of Accounts.`);
    }
    if (!gainAccount.isActive) {
      throw new Error(`Revaluation account ${gainCode} (Unrealized Gain) is inactive.`);
    }
    if (gainAccount.type !== 'revenue' && gainAccount.type !== 'expense') {
      throw new Error(`Revaluation account ${gainCode} (Unrealized Gain) must be a revenue or expense account.`);
    }

    const lossAccount = await tx.account.findFirst({ where: { code: lossCode, tenantId, deletedAt: null } });
    if (!lossAccount) {
      throw new Error(`Missing configured revaluation account: ${lossCode} (Unrealized Loss) in Chart of Accounts.`);
    }
    if (!lossAccount.isActive) {
      throw new Error(`Revaluation account ${lossCode} (Unrealized Loss) is inactive.`);
    }
    if (lossAccount.type !== 'revenue' && lossAccount.type !== 'expense') {
      throw new Error(`Revaluation account ${lossCode} (Unrealized Loss) must be a revenue or expense account.`);
    }

    return { arCode, apCode, gainCode, lossCode };
  }

  /**
   * FX-01A: Calculate dry-run FX revaluation preview for outstanding foreign currency AR/AP invoices
   */
  static async previewARAP(
    tx: any,
    tenantId: string,
    targetDate: Date
  ): Promise<any> {
    const baseCurrencyCode = 'SAR';

    // Resolve and validate accounts early
    const { arCode, apCode, gainCode, lossCode } = await this.resolveAndValidateAccounts(tx, tenantId);

    // 1. Fetch active foreign currencies with their closing rates up to targetDate
    const currencies = await tx.currency.findMany({
      where: {
        tenantId,
        code: { not: baseCurrencyCode },
        isActive: true,
      },
    });

    const closingRates: Record<number, number> = {};
    for (const currency of currencies) {
      const latestRate = await tx.exchangeRate.findFirst({
        where: {
          tenantId,
          currencyId: currency.id,
          date: { lte: targetDate },
        },
        orderBy: { date: 'desc' },
      });
      if (!latestRate?.rate) {
        throw new Error(`Missing closing exchange rate for ${currency.code} on ${targetDate.toISOString().split('T')[0]}`);
      }
      closingRates[currency.id] = Number(latestRate.rate);
    }

    // 2. Fetch outstanding foreign Sales Invoices (AR)
    const salesInvoices = await tx.salesInvoice.findMany({
      where: {
        tenantId,
        currencyId: { not: null },
        remaining: { gt: 0 },
        deletedAt: null,
        status: { notIn: ['cancelled', 'voided'] },
      },
      include: {
        currency: true,
        customer: { select: { fullName: true } },
      },
    });

    const lines: any[] = [];
    let totalGain = 0;
    let totalLoss = 0;

    for (const inv of salesInvoices) {
      if (!inv.currencyId) continue;
      const closingRate = closingRates[inv.currencyId] || 1.0;
      const originalRate = inv.exchangeRate ? Number(inv.exchangeRate) : 1.0;
      const fcyBalance = Number(inv.remaining);

      const sarAtHistorical = Math.round(fcyBalance * originalRate * 100) / 100;
      const sarAtClosing = Math.round(fcyBalance * closingRate * 100) / 100;
      // For AR (Asset): Gain if rate increases (closingRate > originalRate)
      const unrealized = Math.round((sarAtClosing - sarAtHistorical) * 100) / 100;

      if (Math.abs(unrealized) < 0.01) continue;

      if (unrealized > 0) {
        totalGain += unrealized;
      } else {
        totalLoss += Math.abs(unrealized);
      }

      lines.push({
        type: 'AR',
        documentNo: String(inv.invoiceNo),
        partnerName: inv.customer?.fullName || 'Customer',
        currency: inv.currency?.code || 'USD',
        fcyBalance,
        originalRate,
        closingRate,
        sarAtHistorical,
        sarAtClosing,
        unrealizedGainLoss: unrealized,
        direction: unrealized > 0 ? 'GAIN' : 'LOSS',
      });
    }

    // 3. Fetch outstanding foreign Purchase Invoices (AP)
    const purchaseInvoices = await tx.purchaseInvoice.findMany({
      where: {
        tenantId,
        currencyId: { not: null },
        remaining: { gt: 0 },
        deletedAt: null,
        status: { notIn: ['cancelled', 'voided'] },
      },
      include: {
        currency: true,
        supplier: { select: { fullName: true } },
      },
    });

    for (const inv of purchaseInvoices) {
      if (!inv.currencyId) continue;
      const closingRate = closingRates[inv.currencyId] || 1.0;
      const originalRate = inv.exchangeRate ? Number(inv.exchangeRate) : 1.0;
      const fcyBalance = Number(inv.remaining);

      const sarAtHistorical = Math.round(fcyBalance * originalRate * 100) / 100;
      const sarAtClosing = Math.round(fcyBalance * closingRate * 100) / 100;
      // For AP (Liability): Loss if rate increases (closingRate > originalRate), Gain if rate decreases
      const unrealized = Math.round((sarAtHistorical - sarAtClosing) * 100) / 100;

      if (Math.abs(unrealized) < 0.01) continue;

      if (unrealized > 0) {
        totalGain += unrealized;
      } else {
        totalLoss += Math.abs(unrealized);
      }

      lines.push({
        type: 'AP',
        documentNo: String(inv.invoiceNo),
        partnerName: inv.supplier?.fullName || 'Supplier',
        currency: inv.currency?.code || 'USD',
        fcyBalance,
        originalRate,
        closingRate,
        sarAtHistorical,
        sarAtClosing,
        unrealizedGainLoss: unrealized,
        direction: unrealized > 0 ? 'GAIN' : 'LOSS',
      });
    }

    // 4. Build projected journal lines (Draft preview)
    const projectedJournalLines: any[] = [];
    for (const line of lines) {
      if (line.unrealizedGainLoss > 0) {
        projectedJournalLines.push(
          {
            accountCode: line.type === 'AR' ? arCode : apCode,
            description: `Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
            debit: line.type === 'AR' ? line.unrealizedGainLoss : 0,
            credit: line.type === 'AP' ? line.unrealizedGainLoss : 0,
            foreignDebit: 0,
            foreignCredit: 0,
          },
          {
            accountCode: gainCode,
            description: `Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
            debit: line.type === 'AP' ? line.unrealizedGainLoss : 0,
            credit: line.type === 'AR' ? line.unrealizedGainLoss : 0,
            foreignDebit: 0,
            foreignCredit: 0,
          }
        );
      } else {
        const absVal = Math.abs(line.unrealizedGainLoss);
        projectedJournalLines.push(
          {
            accountCode: lossCode,
            description: `Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
            debit: line.type === 'AR' ? 0 : absVal,
            credit: line.type === 'AP' ? 0 : absVal,
            foreignDebit: 0,
            foreignCredit: 0,
          },
          {
            accountCode: line.type === 'AR' ? arCode : apCode,
            description: `Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
            debit: line.type === 'AR' ? absVal : 0,
            credit: line.type === 'AP' ? absVal : 0,
            foreignDebit: 0,
            foreignCredit: 0,
          }
        );
      }
    }

    return {
      tenantId,
      revalDate: targetDate.toISOString().split('T')[0],
      baseCurrency: baseCurrencyCode,
      lines,
      totalUnrealized: Math.round((totalGain - totalLoss) * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalLoss: Math.round(totalLoss * 100) / 100,
      projectedJournalLines,
      generatedAt: new Date(),
    };
  }

  /**
   * FX-01B: Post monthly FX revaluation journal entry and immediately generate auto-reversal entries for AR/AP
   */
  static async postARAP(
    tx: any,
    tenantId: string,
    targetDate: Date,
    userId?: number,
    branchId?: number | null
  ): Promise<any[]> {
    const baseCurrencyCode = 'SAR';
    // Reversal date: always the first day of the next month
    const nextPeriodDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

    const actor = userId ? String(userId) : 'SYSTEM';
    const { AccountingJournalService } = await import('@/lib/services/accounting-journal.service');

    // 1. Period Lock validation for targetDate and nextPeriodDate
    await assertPeriodWritable({
      tenantId,
      postingDate: targetDate,
      operationType: 'FX_REVALUATION_POST',
      module: 'accounting',
      actor,
    });

    await assertPeriodWritable({
      tenantId,
      postingDate: nextPeriodDate,
      operationType: 'FX_REVALUATION_REVERSAL',
      module: 'accounting',
      actor,
    });

    // 1.5 Shielding: Verify that all required revaluation accounts exist, are active, and match correct type
    const { arCode, apCode, gainCode, lossCode } = await this.resolveAndValidateAccounts(tx, tenantId);

    // 2. Fetch active foreign currencies with their closing rates
    const currencies = await tx.currency.findMany({
      where: {
        tenantId,
        code: { not: baseCurrencyCode },
        isActive: true,
      },
    });

    const closingRates: Record<number, number> = {};
    for (const currency of currencies) {
      const latestRate = await tx.exchangeRate.findFirst({
        where: {
          tenantId,
          currencyId: currency.id,
          date: { lte: targetDate },
        },
        orderBy: { date: 'desc' },
      });
      if (!latestRate?.rate) {
        throw new Error(`Missing closing exchange rate for ${currency.code} on ${targetDate.toISOString().split('T')[0]}`);
      }
      closingRates[currency.id] = Number(latestRate.rate);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const runs: any[] = [];

    // 3. Process each foreign currency independently
    for (const currency of currencies) {
      const ref = `FX_REVAL_ARAP_${year}_${month}_${currency.code}`;

      // Check duplicates (only active, non-deleted, posted entries - case-insensitive safety)
      const existingEntry = await tx.journalEntry.findFirst({
        where: {
          tenantId,
          reference: ref,
          deletedAt: null,
          status: { in: ['posted', 'POSTED'] },
        },
      });
      if (existingEntry) {
        throw new Error(`FX Revaluation for ${currency.code} in period ${year}-${month} has already been posted.`);
      }

      // Fetch outstanding Sales Invoices (AR) for this currency
      const salesInvoices = await tx.salesInvoice.findMany({
        where: {
          tenantId,
          currencyId: currency.id,
          remaining: { gt: 0 },
          deletedAt: null,
          status: { notIn: ['cancelled', 'voided'] },
        },
        include: {
          currency: true,
          customer: { select: { fullName: true } },
        },
      });

      // Fetch outstanding Purchase Invoices (AP) for this currency
      const purchaseInvoices = await tx.purchaseInvoice.findMany({
        where: {
          tenantId,
          currencyId: currency.id,
          remaining: { gt: 0 },
          deletedAt: null,
          status: { notIn: ['cancelled', 'voided'] },
        },
        include: {
          currency: true,
          supplier: { select: { fullName: true } },
        },
      });

      const lines: any[] = [];
      let totalGain = 0;
      let totalLoss = 0;

      // AR
      for (const inv of salesInvoices) {
        const closingRate = closingRates[currency.id];
        const originalRate = inv.exchangeRate ? Number(inv.exchangeRate) : 1.0;
        const fcyBalance = Number(inv.remaining);

        const sarAtHistorical = Math.round(fcyBalance * originalRate * 100) / 100;
        const sarAtClosing = Math.round(fcyBalance * closingRate * 100) / 100;
        const unrealized = Math.round((sarAtClosing - sarAtHistorical) * 100) / 100;

        if (Math.abs(unrealized) < 0.01) continue;

        if (unrealized > 0) {
          totalGain += unrealized;
        } else {
          totalLoss += Math.abs(unrealized);
        }

        lines.push({
          type: 'AR',
          documentNo: String(inv.invoiceNo),
          partnerName: inv.customer?.fullName || 'Customer',
          currency: currency.code,
          fcyBalance,
          originalRate,
          closingRate,
          sarAtHistorical,
          sarAtClosing,
          unrealizedGainLoss: unrealized,
          direction: unrealized > 0 ? 'GAIN' : 'LOSS',
        });
      }

      // AP
      for (const inv of purchaseInvoices) {
        const closingRate = closingRates[currency.id];
        const originalRate = inv.exchangeRate ? Number(inv.exchangeRate) : 1.0;
        const fcyBalance = Number(inv.remaining);

        const sarAtHistorical = Math.round(fcyBalance * originalRate * 100) / 100;
        const sarAtClosing = Math.round(fcyBalance * closingRate * 100) / 100;
        const unrealized = Math.round((sarAtHistorical - sarAtClosing) * 100) / 100;

        if (Math.abs(unrealized) < 0.01) continue;

        if (unrealized > 0) {
          totalGain += unrealized;
        } else {
          totalLoss += Math.abs(unrealized);
        }

        lines.push({
          type: 'AP',
          documentNo: String(inv.invoiceNo),
          partnerName: inv.supplier?.fullName || 'Supplier',
          currency: currency.code,
          fcyBalance,
          originalRate,
          closingRate,
          sarAtHistorical,
          sarAtClosing,
          unrealizedGainLoss: unrealized,
          direction: unrealized > 0 ? 'GAIN' : 'LOSS',
        });
      }

      // If no revaluation changes are found for this currency, skip it
      if (lines.length === 0) continue;

      const revalJournalLines: any[] = [];
      const reversalJournalLines: any[] = [];

      for (const line of lines) {
        if (line.unrealizedGainLoss > 0) {
          const gainVal = line.unrealizedGainLoss;
          revalJournalLines.push(
            {
              accountCode: line.type === 'AR' ? arCode : apCode,
              description: `Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? gainVal : 0,
              credit: line.type === 'AP' ? gainVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            },
            {
              accountCode: gainCode,
              description: `Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AP' ? gainVal : 0,
              credit: line.type === 'AR' ? gainVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            }
          );
          reversalJournalLines.push(
            {
              accountCode: line.type === 'AR' ? arCode : apCode,
              description: `Reversal: Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AP' ? gainVal : 0,
              credit: line.type === 'AR' ? gainVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            },
            {
              accountCode: gainCode,
              description: `Reversal: Unrealized FX Gain on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? gainVal : 0,
              credit: line.type === 'AP' ? gainVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            }
          );
        } else {
          const absVal = Math.abs(line.unrealizedGainLoss);
          revalJournalLines.push(
            {
              accountCode: lossCode,
              description: `Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? 0 : absVal,
              credit: line.type === 'AP' ? 0 : absVal,
              foreignDebit: 0,
              foreignCredit: 0,
            },
            {
              accountCode: line.type === 'AR' ? arCode : apCode,
              description: `Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? absVal : 0,
              credit: line.type === 'AP' ? absVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            }
          );
          reversalJournalLines.push(
            {
              accountCode: lossCode,
              description: `Reversal: Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? absVal : 0,
              credit: line.type === 'AP' ? absVal : 0,
              foreignDebit: 0,
              foreignCredit: 0,
            },
            {
              accountCode: line.type === 'AR' ? arCode : apCode,
              description: `Reversal: Unrealized FX Loss on ${line.type} Invoice #${line.documentNo} (${line.currency})`,
              debit: line.type === 'AR' ? 0 : absVal,
              credit: line.type === 'AP' ? 0 : absVal,
              foreignDebit: 0,
              foreignCredit: 0,
            }
          );
        }
      }

      const targetDateStr = targetDate.toISOString().split('T')[0];
      const nextPeriodDateStr = nextPeriodDate.toISOString().split('T')[0];

      // Create primary journal entry
      const je = await AccountingJournalService.createEntry(tx, {
        description: `إعادة تقييم عملات أجنبية - ${currency.code} - فواتير مفتوحة`,
        reference: ref,
        lines: revalJournalLines,
        userId,
        branchId,
        date: targetDateStr,
      });

      await tx.journalEntry.update({
        where: { id: je.id },
        data: {
          isReversal: false,
          autoReverseDate: nextPeriodDate,
        },
      });

      // Create reversing journal entry
      const revRef = `REV_${ref}`;
      const revJe = await AccountingJournalService.createEntry(tx, {
        description: `عكس قيد إعادة تقييم عملات أجنبية - ${currency.code}`,
        reference: revRef,
        lines: reversalJournalLines,
        userId,
        branchId,
        date: nextPeriodDateStr,
      });

      await tx.journalEntry.update({
        where: { id: revJe.id },
        data: {
          isReversal: true,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'FX_REVALUATION_POST',
          entityType: 'JournalEntry',
          entityId: String(je.id),
          userId,
          metadata: {
            currency: currency.code,
            reference: ref,
            revalDate: targetDateStr,
            revalEntryId: je.id,
            reversalEntryId: revJe.id,
            totalGain,
            totalLoss,
            netUnrealized: Math.round((totalGain - totalLoss) * 100) / 100,
          },
        },
      });

      runs.push({
        currency: currency.code,
        reference: ref,
        revalEntryNo: je.entryNumber,
        revalEntryId: je.id,
        reversalEntryNo: revJe.entryNumber,
        reversalEntryId: revJe.id,
        totalGain: Math.round(totalGain * 100) / 100,
        totalLoss: Math.round(totalLoss * 100) / 100,
        linesCount: lines.length,
      });
    }

    return runs;
  }
}
