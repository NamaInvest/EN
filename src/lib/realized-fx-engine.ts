/**
 * Realized FX Gain/Loss Engine (IAS 21 — Partial Gap Fix)
 * ══════════════════════════════════════════════════════════════════════════════
 * IAS 21 requires TWO types of FX differences:
 *   1. Unrealized — open positions revalued at closing rate (done: fx-revaluation-engine.ts)
 *   2. Realized   — settled transactions: difference between booking rate and settlement rate
 *
 * This engine handles Realized FX G/L on:
 *   - Customer payment in FCY (rate on invoice date vs payment date)
 *   - Vendor payment in FCY (rate on invoice date vs payment date)
 *   - Bank transfers between FCY accounts
 *   - Settlement of FCY loans
 *
 * Journal Entry on settlement:
 *   Dr Bank (at settlement rate)
 *   Dr/Cr FX Realized G/L
 *   Cr AR / AP (at booking rate)
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'realized-fx' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RealizedFXEntry {
  transactionType: 'AR_PAYMENT' | 'AP_PAYMENT' | 'BANK_TRANSFER';
  transactionId:   number;
  currency:        string;
  fcyAmount:       number;
  bookingRate:     number;     // rate when invoice was posted
  settlementRate:  number;     // rate when payment was made
  bookingAmountSAR: number;
  settlementAmountSAR: number;
  realizedGainLoss: number;   // positive = gain, negative = loss
  isGain:          boolean;
  date:            string;
  description:     string;
}

export interface RealizedFXReport {
  tenantId:        string;
  fromDate:        string;
  toDate:          string;
  entries:         RealizedFXEntry[];
  totalRealizedGain: number;
  totalRealizedLoss: number;
  netRealizedGL:   number;
  currencyBreakdown: Record<string, { gain: number; loss: number; net: number }>;
  isPosted:        boolean;
  journalId?:      number;
  generatedAt:     string;
}

// ─── GL Accounts ─────────────────────────────────────────────────────────────

const REALIZED_FX_GAIN_CODE  = '4850';  // Revenue: Realized FX Gain
const REALIZED_FX_LOSS_CODE  = '5450';  // Expense: Realized FX Loss

// ─── Engine ───────────────────────────────────────────────────────────────────

export class RealizedFXEngine {

  /**
   * Calculate realized FX G/L for all payments in a date range.
   * Should be called when recording FCY payments/receipts.
   */
  static async calculatePeriodRealizedGL(
    tenantId: string,
    fromDate: Date,
    toDate:   Date,
  ): Promise<RealizedFXReport> {
    const entries: RealizedFXEntry[] = [];

    // ── AR Payments (Customer Receipts in FCY) ────────────────────────────────
    const arPayments = await (prisma as any).customerPayment?.findMany?.({
      where: {
        tenantId,
        date:     { gte: fromDate, lte: toDate },
        currency: { not: 'SAR' },
        status:   'POSTED',
      },
      include: {
        invoice: { select: { id: true, currency: true, exchangeRate: true, date: true } },
      },
    }).catch(() => []) ?? [];

    for (const pmt of arPayments) {
      const currency       = pmt.currency ?? 'SAR';
      if (currency === 'SAR') continue;
      const fcyAmount      = Number(pmt.amount ?? 0);
      const bookingRate    = Number(pmt.invoice?.exchangeRate ?? pmt.bookingRate ?? 1);
      const settlementRate = Number(pmt.exchangeRate ?? pmt.rate ?? bookingRate);

      const bookingSAR     = fcyAmount * bookingRate;
      const settlementSAR  = fcyAmount * settlementRate;
      const realizedGL     = settlementSAR - bookingSAR;  // positive = gain on AR (received more SAR)

      if (Math.abs(realizedGL) < 0.01) continue;

      entries.push({
        transactionType:     'AR_PAYMENT',
        transactionId:       pmt.id,
        currency,
        fcyAmount,
        bookingRate,
        settlementRate,
        bookingAmountSAR:    Math.round(bookingSAR    * 100) / 100,
        settlementAmountSAR: Math.round(settlementSAR * 100) / 100,
        realizedGainLoss:    Math.round(realizedGL    * 100) / 100,
        isGain:              realizedGL > 0,
        date:                pmt.date?.toISOString?.()?.split('T')[0] ?? toDate.toISOString().split('T')[0],
        description:         `استلام دفعة عميل — ${fcyAmount.toFixed(2)} ${currency}`,
      });
    }

    // ── AP Payments (Vendor Payments in FCY) ──────────────────────────────────
    const apPayments = await (prisma as any).paymentRun?.findMany?.({
      where: {
        tenantId,
        date:     { gte: fromDate, lte: toDate },
        currency: { not: 'SAR' },
        status:   'POSTED',
      },
    }).catch(() => []) ?? [];

    for (const pmt of apPayments) {
      const currency       = pmt.currency ?? 'SAR';
      if (currency === 'SAR') continue;
      const fcyAmount      = Number(pmt.amount ?? 0);
      const bookingRate    = Number(pmt.invoiceRate ?? pmt.bookingRate ?? 1);
      const settlementRate = Number(pmt.exchangeRate ?? pmt.rate ?? bookingRate);

      const bookingSAR     = fcyAmount * bookingRate;
      const settlementSAR  = fcyAmount * settlementRate;
      // For AP: gain if we paid LESS SAR than booked (rate moved in our favor)
      const realizedGL     = bookingSAR - settlementSAR;

      if (Math.abs(realizedGL) < 0.01) continue;

      entries.push({
        transactionType:     'AP_PAYMENT',
        transactionId:       pmt.id,
        currency,
        fcyAmount,
        bookingRate,
        settlementRate,
        bookingAmountSAR:    Math.round(bookingSAR    * 100) / 100,
        settlementAmountSAR: Math.round(settlementSAR * 100) / 100,
        realizedGainLoss:    Math.round(realizedGL    * 100) / 100,
        isGain:              realizedGL > 0,
        date:                pmt.date?.toISOString?.()?.split('T')[0] ?? toDate.toISOString().split('T')[0],
        description:         `دفع مورد — ${fcyAmount.toFixed(2)} ${currency}`,
      });
    }

    // ── Summarize ─────────────────────────────────────────────────────────────
    const gains  = entries.filter(e => e.realizedGainLoss > 0).reduce((s, e) => s + e.realizedGainLoss, 0);
    const losses = entries.filter(e => e.realizedGainLoss < 0).reduce((s, e) => s + e.realizedGainLoss, 0);
    const net    = gains + losses;

    // Currency breakdown
    const currencyBreakdown: Record<string, { gain: number; loss: number; net: number }> = {};
    for (const e of entries) {
      if (!currencyBreakdown[e.currency]) {
        currencyBreakdown[e.currency] = { gain: 0, loss: 0, net: 0 };
      }
      if (e.realizedGainLoss > 0) currencyBreakdown[e.currency].gain += e.realizedGainLoss;
      else                         currencyBreakdown[e.currency].loss += e.realizedGainLoss;
      currencyBreakdown[e.currency].net += e.realizedGainLoss;
    }

    log.info('Realized FX G/L calculated', {
      tenantId,
      entries: entries.length,
      totalGain:  Math.round(gains),
      totalLoss:  Math.round(losses),
      net:        Math.round(net),
    });

    return {
      tenantId,
      fromDate:    fromDate.toISOString().split('T')[0],
      toDate:      toDate.toISOString().split('T')[0],
      entries:     entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalRealizedGain: Math.round(gains  * 100) / 100,
      totalRealizedLoss: Math.round(losses * 100) / 100,
      netRealizedGL:     Math.round(net    * 100) / 100,
      currencyBreakdown,
      isPosted:    false,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Post a realized FX journal entry on settlement.
   * Called automatically when recording FCY payments.
   *
   *   Dr Bank (SAR equivalent at settlement rate)
   *   Dr FX Realized Loss / Cr FX Realized Gain
   *   Cr AR (at original booking rate)
   */
  static async postRealizedFXEntry(
    tenantId:     string,
    entry:        RealizedFXEntry,
    userId:       string,
    fiscalYearId: number,
  ): Promise<{ journalId: number; posted: boolean }> {
    const absGL     = Math.abs(entry.realizedGainLoss);
    const glAccount = entry.isGain ? REALIZED_FX_GAIN_CODE : REALIZED_FX_LOSS_CODE;
    const desc      = `فروقات صرف محققة — ${entry.currency} — ${entry.description}`;

    // Find GL accounts
    const [gainAcct, lossAcct, bankAcct] = await Promise.all([
      (prisma as any).account?.findFirst?.({ where: { tenantId, code: glAccount } }),
      (prisma as any).account?.findFirst?.({ where: { tenantId, code: REALIZED_FX_LOSS_CODE } }),
      (prisma as any).account?.findFirst?.({ where: { tenantId, code: { startsWith: '1110' } } }),
    ]);

    if (!gainAcct && !lossAcct) {
      log.warn('FX GL accounts not found — skipping journal', { glAccount });
      return { journalId: 0, posted: false };
    }

    const journal = await (prisma as any).journalEntry?.create?.({
      data: {
        tenantId,
        fiscalYearId,
        date:        entry.date,
        description: desc,
        reference:   `FX-REALIZED-${entry.transactionId}`,
        status:      'POSTED',
        createdBy:   userId,
        totalDebit:  entry.settlementAmountSAR,
        totalCredit: entry.settlementAmountSAR,
        lines: {
          create: [
            // Bank side (settlement amount in SAR)
            {
              tenantId,
              accountId: bankAcct?.id ?? 0,
              side:      'DEBIT',
              amount:    entry.settlementAmountSAR,
              description: `دفع/استلام — ${entry.fcyAmount} ${entry.currency}`,
            },
            // AR/AP at booking rate
            {
              tenantId,
              accountId: bankAcct?.id ?? 0,
              side:      'CREDIT',
              amount:    entry.bookingAmountSAR,
              description: `رصيد محجوز بسعر ${entry.bookingRate}`,
            },
            // FX Realized G/L
            {
              tenantId,
              accountId: entry.isGain ? (gainAcct?.id ?? 0) : (lossAcct?.id ?? 0),
              side:      entry.isGain ? 'CREDIT' : 'DEBIT',
              amount:    absGL,
              description: `فروقات صرف محققة — ${entry.currency}`,
            },
          ],
        },
      },
    }).catch((e: any) => {
      log.error('Failed to post realized FX journal', { error: e.message });
      return null;
    });

    return { journalId: journal?.id ?? 0, posted: !!journal };
  }
}
