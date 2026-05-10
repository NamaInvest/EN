/**
 * Hedge Accounting API
 * ════════════════════
 * GET  /api/finance/hedge              — قائمة علاقات التحوط + ملخص
 * POST /api/finance/hedge              — تحديد علاقة تحوط جديدة
 * POST /api/finance/hedge/test         — اختبار الفاعلية
 * POST /api/finance/hedge/entries      — توليد القيود المحاسبية
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  HedgeAccountingEngine,
  HedgeType,
  InstrumentType,
} from '@/lib/hedge-accounting-engine';

const log = logger.child({ service: 'api.finance.hedge' });

// ── GET: Hedge Dashboard ─────────────────────────────────────────
async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      // Quick effectiveness test via query params
      const hedgedItem = parseFloat(searchParams.get('hedgedItem') || '0');
      const instrument = parseFloat(searchParams.get('instrument') || '0');
      const result = HedgeAccountingEngine.testEffectiveness(hedgedItem, instrument);
      return NextResponse.json(result);
    }

    const summary = await HedgeAccountingEngine.getHedgeSummary();
    return NextResponse.json({ summary });
  } catch (error: any) {
    log.error('Hedge GET error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات التحوط' }, { status: 500 });
  }
}

// ── POST: Multiple actions ───────────────────────────────────────
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await request.json();
    const { action } = body;

    // ── Action: designate ──────────────────────────────────────
    if (action === 'designate') {
      const {
        hedgeType, hedgedItemDescription, hedgingInstrumentType,
        notionalAmount, currency, startDate, endDate, hedgeRatio,
      } = body;

      if (!hedgeType || !hedgedItemDescription || !notionalAmount) {
        return NextResponse.json(
          { error: 'نوع التحوط والبند المحوط والمبلغ الاسمي مطلوبة' },
          { status: 400 }
        );
      }

      const relationship = await HedgeAccountingEngine.designate({
        hedgeType: hedgeType as HedgeType,
        hedgedItemDescription,
        hedgingInstrumentType: (hedgingInstrumentType || 'FORWARD_FX') as InstrumentType,
        notionalAmount: parseFloat(notionalAmount),
        currency: currency || 'SAR',
        startDate: new Date(startDate || Date.now()),
        endDate: new Date(endDate || Date.now()),
        hedgeRatio: hedgeRatio ? parseFloat(hedgeRatio) : 1.0,
        tenantId: auth.tenantId,
      });

      return NextResponse.json({
        success: true,
        relationship,
        message: 'تم تحديد علاقة التحوط وتوثيقها وفق IFRS 9',
      });
    }

    // ── Action: test-effectiveness ────────────────────────────
    if (action === 'test-effectiveness') {
      const { hedgedItemFVChange, instrumentFVChange } = body;
      const result = HedgeAccountingEngine.testEffectiveness(
        parseFloat(hedgedItemFVChange),
        parseFloat(instrumentFVChange)
      );

      return NextResponse.json({
        ...result,
        interpretation: result.isEffective
          ? `✅ علاقة التحوط فعالة (نسبة ${(result.ratio * 100).toFixed(1)}% — ضمن نطاق 80%-125%)`
          : `❌ علاقة التحوط غير فعالة (نسبة ${(result.ratio * 100).toFixed(1)}% — خارج النطاق المقبول)`,
      });
    }

    // ── Action: journal-entries ───────────────────────────────
    if (action === 'journal-entries') {
      const { hedgeType, effectivePortion, ineffectivePortion, instrumentFVChange, hedgedItemFVChange, isReclassification } = body;

      let entries;
      switch (hedgeType as HedgeType) {
        case 'FAIR_VALUE':
          entries = HedgeAccountingEngine.fairValueHedgeEntries({
            instrumentFVChange: parseFloat(instrumentFVChange || 0),
            hedgedItemFVChange: parseFloat(hedgedItemFVChange || 0),
            ineffectivePortion: parseFloat(ineffectivePortion || 0),
          });
          break;
        case 'CASH_FLOW':
          entries = HedgeAccountingEngine.cashFlowHedgeEntries({
            effectivePortion: parseFloat(effectivePortion || 0),
            ineffectivePortion: parseFloat(ineffectivePortion || 0),
            isReclassification: !!isReclassification,
          });
          break;
        case 'NET_INVESTMENT':
          entries = HedgeAccountingEngine.netInvestmentHedgeEntries({
            effectivePortion: parseFloat(effectivePortion || 0),
            ineffectivePortion: parseFloat(ineffectivePortion || 0),
          });
          break;
        default:
          return NextResponse.json({ error: 'نوع تحوط غير صالح' }, { status: 400 });
      }

      return NextResponse.json({
        entries,
        standard: 'IFRS 9.6.5',
        hedgeType,
        balanced: entries.balanced,
      });
    }

    // ── Action: fx-fair-value ─────────────────────────────────
    if (action === 'fx-fair-value') {
      const { contractRate, currentForwardRate, notionalAmount, daysToMaturity, discountRate } = body;
      const fv = HedgeAccountingEngine.calculateForwardFXFairValue({
        contractRate: parseFloat(contractRate),
        currentForwardRate: parseFloat(currentForwardRate),
        notionalAmount: parseFloat(notionalAmount),
        daysToMaturity: parseInt(daysToMaturity),
        discountRate: parseFloat(discountRate || 0.05),
      });

      return NextResponse.json({
        fairValue: Math.round(fv * 100) / 100,
        direction: fv > 0 ? 'ASSET' : 'LIABILITY',
        description: fv > 0 ? 'مكسب غير محقق على عقد Forward' : 'خسارة غير محققة على عقد Forward',
      });
    }

    // ── Action: discontinue ───────────────────────────────────
    if (action === 'discontinue') {
      const { hedgeRelationshipId, reason, notes } = body;
      await HedgeAccountingEngine.discontinue(
        parseInt(hedgeRelationshipId),
        reason,
        notes
      );
      return NextResponse.json({ success: true, message: 'تم وقف علاقة التحوط' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Hedge POST error:', error);
    return NextResponse.json({ error: error.message || 'فشل معالجة طلب التحوط' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
