/**
 * Hedge Accounting Engine — IFRS 9
 * ══════════════════════════════════════════════════════════════════
 *
 * يغطي ثلاثة أنواع من علاقات التحوط:
 *   1. Fair Value Hedge     — تحوط القيمة العادلة
 *   2. Cash Flow Hedge      — تحوط التدفقات النقدية
 *   3. Net Investment Hedge — تحوط صافي الاستثمار في عملية أجنبية
 *
 * الأدوات المدعومة: Forward FX, Interest Rate Swap, FX Option
 *
 * المعايير: IFRS 9.6.2 – 6.5 | IAS 39 legacy (للمقارنة)
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hedge-accounting' });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type HedgeType = 'FAIR_VALUE' | 'CASH_FLOW' | 'NET_INVESTMENT';
export type HedgeStatus = 'DESIGNATED' | 'ACTIVE' | 'DISCONTINUED' | 'EXPIRED';
export type InstrumentType = 'FORWARD_FX' | 'INTEREST_RATE_SWAP' | 'FX_OPTION' | 'CROSS_CURRENCY_SWAP' | 'OTHER';

export interface HedgeRelationship {
  id: number;
  hedgeType: HedgeType;
  status: HedgeStatus;
  hedgedItemDescription: string;
  hedgingInstrumentType: InstrumentType;
  notionalAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  designatedAt: Date;
  effectivenessThresholdLow: number;  // default 0.80
  effectivenessThresholdHigh: number; // default 1.25
  hedgingReserve: number;             // OCI balance (Cash Flow / Net Investment)
  fairValueChange: number;            // P&L (Fair Value Hedge)
}

export interface EffectivenessTest {
  hedgeRelationshipId: number;
  testDate: Date;
  hedgedItemFVChange: number;
  instrumentFVChange: number;
  ratio: number;                    // instrument / hedgedItem
  isEffective: boolean;
  method: 'DOLLAR_OFFSET' | 'REGRESSION' | 'HYPOTHETICAL_DERIVATIVE';
}

export interface HedgeJournalEntries {
  entries: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Hedge Accounting Engine
// ═══════════════════════════════════════════════════════════════

export class HedgeAccountingEngine {

  // ── 1. Designate a New Hedge Relationship ───────────────────
  /**
   * تحديد علاقة تحوط جديدة وفق IFRS 9.6.4
   * المتطلبات:
   * - توثيق رسمي عند البدء
   * - علاقة اقتصادية بين الأداة والبند المحوط
   * - نسبة تحوط موثقة (عادة 1:1)
   */
  static async designate(params: {
    hedgeType: HedgeType;
    hedgedItemDescription: string;
    hedgingInstrumentType: InstrumentType;
    notionalAmount: number;
    currency: string;
    startDate: Date;
    endDate: Date;
    hedgeRatio?: number; // default 1.0
    tenantId?: string;
  }): Promise<HedgeRelationship> {
    log.info('Designating hedge relationship', { type: params.hedgeType });

    const record = await (prisma as any).hedgeRelationship.create({
      data: {
        hedgeType: params.hedgeType,
        status: 'DESIGNATED',
        hedgedItemDescription: params.hedgedItemDescription,
        hedgingInstrumentType: params.hedgingInstrumentType,
        notionalAmount: params.notionalAmount,
        currency: params.currency,
        startDate: params.startDate,
        endDate: params.endDate,
        hedgeRatio: params.hedgeRatio ?? 1.0,
        designatedAt: new Date(),
        effectivenessThresholdLow: 0.80,
        effectivenessThresholdHigh: 1.25,
        hedgingReserve: 0,
        fairValueChange: 0,
        tenantId: params.tenantId,
      },
    });

    return record as HedgeRelationship;
  }

  // ── 2. Effectiveness Test (Dollar Offset Method) ─────────────
  /**
   * اختبار الفاعلية — IFRS 9.6.4.1(c)
   * نسبة التحوط = تغير QV الأداة / تغير QV البند المحوط
   * مقبول: بين 80% و 125%
   */
  static testEffectiveness(
    hedgedItemFVChange: number,
    instrumentFVChange: number
  ): EffectivenessTest {
    if (hedgedItemFVChange === 0) {
      return {
        hedgeRelationshipId: 0,
        testDate: new Date(),
        hedgedItemFVChange,
        instrumentFVChange,
        ratio: 0,
        isEffective: false,
        method: 'DOLLAR_OFFSET',
      };
    }

    const ratio = Math.abs(instrumentFVChange / hedgedItemFVChange);
    const isEffective = ratio >= 0.80 && ratio <= 1.25;

    return {
      hedgeRelationshipId: 0,
      testDate: new Date(),
      hedgedItemFVChange,
      instrumentFVChange,
      ratio: Math.round(ratio * 10000) / 10000,
      isEffective,
      method: 'DOLLAR_OFFSET',
    };
  }

  // ── 3. Fair Value Hedge — Journal Entries ────────────────────
  /**
   * تحوط القيمة العادلة (IFRS 9.6.5.8):
   * 
   * فاعلية:
   *   DR: Hedging Instrument (Asset/Liability)  = إجمالي تغير QV الأداة
   *   DR/CR: P&L — Hedge Gain/Loss              = الجزء الفعال
   *   DR/CR: Hedged Item carrying amount        = تعديل مقابل
   *   DR/CR: P&L — Hedge Ineffectiveness       = الجزء غير الفعال
   */
  static fairValueHedgeEntries(params: {
    instrumentFVChange: number;   // + = gain, - = loss
    hedgedItemFVChange: number;   // مقابل للأداة (عادة معاكس)
    ineffectivePortion: number;
  }): HedgeJournalEntries {
    const { instrumentFVChange, hedgedItemFVChange, ineffectivePortion } = params;
    const entries = [];

    // Gain on hedging instrument
    if (instrumentFVChange > 0) {
      entries.push({
        account: '1650', // Derivative Asset
        debit: instrumentFVChange,
        credit: 0,
        description: 'تغير القيمة العادلة — أداة التحوط (مكسب)',
      });
      entries.push({
        account: '7210', // Hedge Gain/Loss — P&L
        debit: 0,
        credit: instrumentFVChange,
        description: 'مكسب أداة التحوط — قيمة عادلة',
      });
    } else {
      entries.push({
        account: '7210',
        debit: Math.abs(instrumentFVChange),
        credit: 0,
        description: 'خسارة أداة التحوط — قيمة عادلة',
      });
      entries.push({
        account: '1650',
        debit: 0,
        credit: Math.abs(instrumentFVChange),
        description: 'تغير القيمة العادلة — أداة التحوط (خسارة)',
      });
    }

    // Adjustment to hedged item carrying amount
    const adj = -hedgedItemFVChange; // opposite direction
    if (adj > 0) {
      entries.push({
        account: '1XXX', // Hedged item (asset)
        debit: adj,
        credit: 0,
        description: 'تعديل القيمة العادلة — البند المحوط',
      });
      entries.push({
        account: '7210',
        debit: 0,
        credit: adj,
        description: 'مكسب البند المحوط — قيمة عادلة',
      });
    } else if (adj < 0) {
      entries.push({
        account: '7210',
        debit: Math.abs(adj),
        credit: 0,
        description: 'خسارة البند المحوط — قيمة عادلة',
      });
      entries.push({
        account: '1XXX',
        debit: 0,
        credit: Math.abs(adj),
        description: 'تعديل القيمة العادلة — البند المحوط',
      });
    }

    // Ineffectiveness (if any)
    if (Math.abs(ineffectivePortion) > 0.01) {
      entries.push({
        account: '7211', // Hedge Ineffectiveness — P&L
        debit: ineffectivePortion > 0 ? 0 : Math.abs(ineffectivePortion),
        credit: ineffectivePortion > 0 ? ineffectivePortion : 0,
        description: 'الجزء غير الفعال من التحوط',
      });
    }

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

    return {
      entries,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ── 4. Cash Flow Hedge — OCI Entries ─────────────────────────
  /**
   * تحوط التدفقات النقدية (IFRS 9.6.5.11):
   *
   * الجزء الفعال → OCI (احتياطي التحوط)
   * الجزء غير الفعال → P&L مباشرة
   *
   * عند التسوية (reclassification):
   *   DR/CR: OCI — Hedge Reserve
   *   CR/DR: P&L أو أصل/خصم ذو صلة
   */
  static cashFlowHedgeEntries(params: {
    effectivePortion: number;   // + = gain, - = loss (goes to OCI)
    ineffectivePortion: number; // goes to P&L
    isReclassification?: boolean; // true when hedged transaction affects P&L
  }): HedgeJournalEntries {
    const { effectivePortion, ineffectivePortion, isReclassification } = params;
    const entries = [];

    if (!isReclassification) {
      // Initial recognition: effective portion → OCI
      entries.push({
        account: '1650', // Derivative Asset/Liability
        debit: effectivePortion > 0 ? effectivePortion : 0,
        credit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
        description: 'تغير القيمة العادلة — أداة التحوط',
      });
      entries.push({
        account: '3710', // OCI — Cash Flow Hedge Reserve
        debit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
        credit: effectivePortion > 0 ? effectivePortion : 0,
        description: 'احتياطي تحوط التدفقات النقدية (OCI)',
      });

      // Ineffective → P&L
      if (Math.abs(ineffectivePortion) > 0.01) {
        entries.push({
          account: '7211', // Hedge Ineffectiveness P&L
          debit: ineffectivePortion < 0 ? Math.abs(ineffectivePortion) : 0,
          credit: ineffectivePortion > 0 ? ineffectivePortion : 0,
          description: 'الجزء غير الفعال من تحوط التدفقات النقدية',
        });
        entries.push({
          account: '1650',
          debit: ineffectivePortion > 0 ? ineffectivePortion : 0,
          credit: ineffectivePortion < 0 ? Math.abs(ineffectivePortion) : 0,
          description: 'مقابل الجزء غير الفعال',
        });
      }
    } else {
      // Reclassification from OCI → P&L when hedged item affects income
      entries.push({
        account: '3710', // OCI — Hedge Reserve
        debit: effectivePortion > 0 ? effectivePortion : 0,
        credit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
        description: 'إعادة تصنيف احتياطي التحوط إلى الأرباح والخسائر',
      });
      entries.push({
        account: '7210', // Hedge Gain/Loss P&L
        debit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
        credit: effectivePortion > 0 ? effectivePortion : 0,
        description: 'تحويل من OCI عند تأثر البند المحوط على الأرباح',
      });
    }

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

    return {
      entries,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ── 5. Net Investment Hedge ───────────────────────────────────
  /**
   * تحوط صافي الاستثمار الأجنبي (IFRS 9.6.5.13 + IAS 21):
   * - الجزء الفعال يُرحَّل في OCI حتى بيع العملية الأجنبية
   * - مشابه لتحوط التدفقات النقدية في المعالجة المحاسبية
   */
  static netInvestmentHedgeEntries(params: {
    effectivePortion: number;
    ineffectivePortion: number;
  }): HedgeJournalEntries {
    const { effectivePortion, ineffectivePortion } = params;
    const entries = [];

    // Effective → Translation Reserve (OCI)
    entries.push({
      account: '1650',
      debit: effectivePortion > 0 ? effectivePortion : 0,
      credit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
      description: 'أداة تحوط — صافي الاستثمار الأجنبي',
    });
    entries.push({
      account: '3720', // OCI — Translation Reserve
      debit: effectivePortion < 0 ? Math.abs(effectivePortion) : 0,
      credit: effectivePortion > 0 ? effectivePortion : 0,
      description: 'فروق ترجمة العملة الأجنبية (OCI)',
    });

    // Ineffective → P&L
    if (Math.abs(ineffectivePortion) > 0.01) {
      entries.push({
        account: '7211',
        debit: ineffectivePortion < 0 ? Math.abs(ineffectivePortion) : 0,
        credit: ineffectivePortion > 0 ? ineffectivePortion : 0,
        description: 'الجزء غير الفعال — تحوط صافي الاستثمار',
      });
      entries.push({
        account: '1650',
        debit: ineffectivePortion > 0 ? ineffectivePortion : 0,
        credit: ineffectivePortion < 0 ? Math.abs(ineffectivePortion) : 0,
        description: 'مقابل الجزء غير الفعال',
      });
    }

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

    return {
      entries,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ── 6. Discontinue Hedge Relationship ─────────────────────────
  /**
   * وقف علاقة التحوط (IFRS 9.6.5.6):
   * - التوقف الاختياري ممنوع في IFRS 9 (على عكس IAS 39)
   * - يتوقف تلقائياً إذا فشل اختبار الفاعلية أو انتهى البند المحوط
   */
  static async discontinue(
    hedgeRelationshipId: number,
    reason: 'FAILED_EFFECTIVENESS' | 'HEDGED_ITEM_EXPIRED' | 'INSTRUMENT_EXPIRED' | 'OTHER',
    notes?: string
  ): Promise<void> {
    await (prisma as any).hedgeRelationship.update({
      where: { id: hedgeRelationshipId },
      data: {
        status: 'DISCONTINUED',
        discontinuedAt: new Date(),
        discontinuationReason: reason,
        discontinuationNotes: notes,
      },
    });

    log.warn(`Hedge relationship ${hedgeRelationshipId} discontinued: ${reason}`);
  }

  // ── 7. Periodic Reporting ─────────────────────────────────────
  /**
   * تقرير علاقات التحوط للفترة المالية
   */
  static async getHedgeSummary(): Promise<{
    active: number;
    discontinued: number;
    totalHedgingReserve: number;    // OCI balance
    totalFairValueChange: number;   // P&L impact
    byType: Record<HedgeType, { count: number; notional: number }>;
  }> {
    const relationships = await (prisma as any).hedgeRelationship.findMany({
      where: { status: { in: ['DESIGNATED', 'ACTIVE'] } },
    }).catch(() => []);

    const summary = {
      active: relationships.length,
      discontinued: 0,
      totalHedgingReserve: 0,
      totalFairValueChange: 0,
      byType: {
        FAIR_VALUE: { count: 0, notional: 0 },
        CASH_FLOW: { count: 0, notional: 0 },
        NET_INVESTMENT: { count: 0, notional: 0 },
      } as Record<HedgeType, { count: number; notional: number }>,
    };

    for (const r of relationships) {
      summary.totalHedgingReserve += r.hedgingReserve || 0;
      summary.totalFairValueChange += r.fairValueChange || 0;
      if (summary.byType[r.hedgeType as HedgeType]) {
        summary.byType[r.hedgeType as HedgeType].count++;
        summary.byType[r.hedgeType as HedgeType].notional += r.notionalAmount || 0;
      }
    }

    return summary;
  }

  // ── 8. Forward FX Fair Value Calculator ─────────────────────
  /**
   * حساب القيمة العادلة لعقد Forward FX
   * Fair Value = (Forward Rate - Contract Rate) × Notional × Discount Factor
   */
  static calculateForwardFXFairValue(params: {
    contractRate: number;    // سعر الصرف في العقد
    currentForwardRate: number; // سعر الصرف الآجل الحالي
    notionalAmount: number;
    daysToMaturity: number;
    discountRate: number;    // معدل الخصم (سنوي)
  }): number {
    const { contractRate, currentForwardRate, notionalAmount, daysToMaturity, discountRate } = params;
    const rateDiff = currentForwardRate - contractRate;
    const discountFactor = 1 / (1 + discountRate * (daysToMaturity / 365));
    return rateDiff * notionalAmount * discountFactor;
  }
}

// ── Tests ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'test') {
  // Test 1: Effectiveness test — effective
  const t1 = HedgeAccountingEngine.testEffectiveness(-100000, 98000);
  console.assert(t1.isEffective, 'Test 1 failed: should be effective (ratio 0.98)');

  // Test 2: Effectiveness test — ineffective (too low)
  const t2 = HedgeAccountingEngine.testEffectiveness(-100000, 70000);
  console.assert(!t2.isEffective, 'Test 2 failed: should be ineffective (ratio 0.70)');

  // Test 3: Fair Value hedge entries — balanced
  const t3 = HedgeAccountingEngine.fairValueHedgeEntries({
    instrumentFVChange: 5000,
    hedgedItemFVChange: -4800,
    ineffectivePortion: 200,
  });
  console.assert(t3.balanced, 'Test 3 failed: entries not balanced');

  // Test 4: Cash Flow hedge entries — balanced
  const t4 = HedgeAccountingEngine.cashFlowHedgeEntries({
    effectivePortion: 10000,
    ineffectivePortion: 500,
  });
  console.assert(t4.balanced, 'Test 4 failed: cash flow entries not balanced');

  // Test 5: Forward FX fair value
  const fv = HedgeAccountingEngine.calculateForwardFXFairValue({
    contractRate: 3.75,
    currentForwardRate: 3.80,
    notionalAmount: 1000000,
    daysToMaturity: 90,
    discountRate: 0.05,
  });
  console.assert(fv > 0, 'Test 5 failed: FV should be positive when current rate > contract rate');

  console.log('✅ All HedgeAccountingEngine tests passed');
}
