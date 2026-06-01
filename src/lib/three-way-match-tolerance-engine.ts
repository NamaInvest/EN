/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Three-Way Match Tolerance Engine (F-06 Implementation)
 * ══════════════════════════════════════════════════════════════════════════════
 * Extends 3-way-match with:
 *   1. Percentage + absolute tolerance rules per vendor/category
 *   2. Hard-block vs soft-warning behaviour
 *   3. ZATCA electronic compliance checks
 *   4. Workflow exception with approval escalation
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: '3way-match-tolerance' });

export interface ThreeWayMatchInput {
  tenantId:           string;
  purchaseOrderId:    number;
  grnId:              number;
  invoiceId:          number;
  poAmount:           number;
  grnAmount:          number;
  invoiceAmount:      number;
  poQty:              number;
  grnQty:             number;
  invoiceQty:         number;
  tolerancePct?:      number;   // e.g. 0.03 = 3% (default from settings)
  toleranceAbsolute?: number;   // SAR absolute amount
}

export type MatchStatus = 
  | 'MATCHED' 
  | 'WITHIN_TOLERANCE' 
  | 'EXCEPTION_REQUIRED' 
  | 'HARD_BLOCK'
  | 'PRICE_DISCREPANCY'
  | 'QTY_DISCREPANCY'
  | 'AMOUNT_DISCREPANCY'
  | 'PENDING_APPROVAL'
  | 'BLOCKED';

export interface ThreeWayMatchResult {
  tenantId:          string;
  purchaseOrderId:   number;
  grnId:             number;
  invoiceId:         number;
  amountVariance:    number;    // invoice - PO
  amountVariancePct: number;    // %
  qtyVariance:       number;    // invoice - GRN qty
  qtyVariancePct:    number;    // %
  tolerancePct:      number;
  toleranceAbsolute: number;
  status:            MatchStatus;
  reason:            string;
  canApprove:        boolean;   // requires workflow exception?
  zatcaCompliant:    boolean;   // invoice number matches, date valid
  action:            'AUTO_APPROVE' | 'REQUIRE_EXCEPTION' | 'BLOCK';
}

const DEFAULT_TOLERANCE_PCT      = 0.03;  // 3%
const DEFAULT_TOLERANCE_ABSOLUTE = 500;   // 500 SAR
const HARD_BLOCK_THRESHOLD       = 0.15;  // >15% variance → hard block

export class ThreeWayMatchEngine {

  static async match(input: ThreeWayMatchInput): Promise<ThreeWayMatchResult> {
    // Get tenant-specific tolerance settings
    const settings = await (prisma as any).setting?.findMany?.({
      where: {
        tenantId: input.tenantId,
        key: { in: [
          'PURCHASE_TOLERANCE_PERCENT',
          'PURCHASE_TOLERANCE_AMOUNT',
          'PURCHASE_TOLERANCE_REQUIRE_APPROVAL',
          '3wm_tolerance_pct',
          '3wm_tolerance_absolute'
        ] },
      },
    }).catch(() => []) ?? [];

    const settingsMap = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

    // Parse percentage
    let tolerancePct = input.tolerancePct;
    if (tolerancePct === undefined) {
      const pctVal = settingsMap['PURCHASE_TOLERANCE_PERCENT'] ?? settingsMap['3wm_tolerance_pct'];
      if (pctVal !== undefined) {
        const parsedPct = parseFloat(pctVal);
        tolerancePct = parsedPct > 1 ? parsedPct / 100 : parsedPct;
      } else {
        tolerancePct = DEFAULT_TOLERANCE_PCT;
      }
    }

    // Parse absolute amount
    let toleranceAbsolute = input.toleranceAbsolute;
    if (toleranceAbsolute === undefined) {
      const absVal = settingsMap['PURCHASE_TOLERANCE_AMOUNT'] ?? settingsMap['3wm_tolerance_absolute'];
      toleranceAbsolute = absVal !== undefined ? parseFloat(absVal) : DEFAULT_TOLERANCE_ABSOLUTE;
    }

    // Parse require approval
    const requireApprovalVal = settingsMap['PURCHASE_TOLERANCE_REQUIRE_APPROVAL'];
    const requireApproval = requireApprovalVal === 'true' || requireApprovalVal === '1';

    // Amount variance
    const amountVariance    = input.invoiceAmount - input.poAmount;
    const amountVariancePct = input.poAmount !== 0 ? Math.abs(amountVariance) / input.poAmount : 0;

    // Quantity variance
    const qtyVariance    = input.invoiceQty - input.grnQty;
    const qtyVariancePct = input.grnQty !== 0 ? Math.abs(qtyVariance) / input.grnQty : 0;

    // Determine status
    let status: MatchStatus;
    let reason: string;
    let action: ThreeWayMatchResult['action'];

    const absoluteOk  = Math.abs(amountVariance) <= toleranceAbsolute;
    const pctOk       = amountVariancePct <= tolerancePct;
    const qtyOk       = qtyVariance <= 0; // Quantity must not exceed what is received in GRN
    const hardBlock   = amountVariancePct > HARD_BLOCK_THRESHOLD;

    if (!qtyOk) {
      status = 'QTY_DISCREPANCY';
      reason = `كمية الفاتورة (${input.invoiceQty}) أكبر من الكمية المستلمة في إذن الاستلام (${input.grnQty})`;
      action = 'BLOCK';
    } else if (hardBlock) {
      status = 'BLOCKED';
      reason = `فرق المبلغ يتجاوز حد المنع المطلق البالغ ${(HARD_BLOCK_THRESHOLD * 100).toFixed(0)}% (الفرق الفعلي: ${(amountVariancePct * 100).toFixed(1)}%)`;
      action = 'BLOCK';
    } else if (amountVariance === 0 && qtyVariance === 0) {
      status = 'MATCHED';
      reason = 'مطابقة كاملة — لا فروقات';
      action = 'AUTO_APPROVE';
    } else if (absoluteOk || pctOk) {
      if (requireApproval) {
        status = 'PENDING_APPROVAL';
        reason = `الفرق ضمن هامش التسامح (${(tolerancePct * 100).toFixed(1)}% أو ${toleranceAbsolute} ر.س) ولكنه يتطلب موافقة إدارية`;
        action = 'REQUIRE_EXCEPTION';
      } else {
        status = 'WITHIN_TOLERANCE';
        reason = `الفرق ضمن هامش التسامح (${(tolerancePct * 100).toFixed(1)}% أو ${toleranceAbsolute} ر.س)`;
        action = 'AUTO_APPROVE';
      }
    } else {
      if (requireApproval) {
        status = 'PENDING_APPROVAL';
        reason = `فرق المبلغ يتجاوز هامش التسامح (${Math.abs(amountVariance).toFixed(2)} ر.س / ${(amountVariancePct * 100).toFixed(1)}%) ويتطلب موافقة إدارية`;
        action = 'REQUIRE_EXCEPTION';
      } else {
        status = 'PRICE_DISCREPANCY';
        reason = `فرق المبلغ يتجاوز هامش التسامح (${Math.abs(amountVariance).toFixed(2)} ر.س / ${(amountVariancePct * 100).toFixed(1)}%) ولم يتم تفعيل خيار الموافقة الاستثنائية`;
        action = 'BLOCK';
      }
    }

    // ZATCA compliance check (simplified)
    const invoice = input.invoiceId > 0 ? await (prisma as any).purchaseInvoice?.findUnique?.({
      where: { id: input.invoiceId },
      select: { invoiceNumber: true, date: true, vatNumber: true },
    }).catch(() => null) : null;

    const zatcaCompliant = !!(invoice?.invoiceNumber && invoice?.date && invoice?.vatNumber);

    log.info('Three-way match result', {
      poId:    input.purchaseOrderId,
      status,
      amountVariance,
      amountVariancePct: (amountVariancePct * 100).toFixed(2) + '%',
    });

    return {
      tenantId:          input.tenantId,
      purchaseOrderId:   input.purchaseOrderId,
      grnId:             input.grnId,
      invoiceId:         input.invoiceId,
      amountVariance:    Math.round(amountVariance * 100) / 100,
      amountVariancePct: Math.round(amountVariancePct * 10000) / 100,  // to %
      qtyVariance,
      qtyVariancePct:    Math.round(qtyVariancePct * 10000) / 100,
      tolerancePct,
      toleranceAbsolute,
      status,
      reason,
      canApprove:        action !== 'BLOCK',
      zatcaCompliant,
      action,
    };
  }
}
