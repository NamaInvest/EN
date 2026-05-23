'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Nitaqat Simulator — `/hr/nitaqat-simulator`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  محاكي قرارات التوظيف:
 *   - يحسب تأثير توظيف X سعودي + Y وافد على النطاق
 *   - يقترح "هل أوظف؟" قبل اتخاذ القرار
 *   - يمنع تدهور النطاق من Green إلى Yellow
 *
 *  المثال:
 *   حالياً: 10 موظفين (3 سعوديين = 30%) → نطاق أصفر
 *   لو وظفت 2 سعودي + 5 وافد: 17 (5 سعوديين = 29%) → ما زال أصفر، الإجمالي زاد بدون تحسن
 *   لو وظفت 3 سعودي فقط: 13 (6 = 46%) → أخضر! ✓
 *
 *  Permission: admin / owner / hr_officer
 *
 *  @see src/app/api/saudi/nitaqat/projection/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Award,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Users,
  Plus,
  Minus,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectionResult {
  current: { total: number; saudi: number };
  projection: {
    newTotal: number;
    newSaudi: number;
    newPct: number;
    currentBand: string;
    projectedBand: string;
    improvement: boolean;
  };
  recommendation: string;
}

const BAND_META: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  PLATINUM: { color: '#7C3AED', bg: '#F3E8FF', ar: 'بلاتيني', en: 'Platinum' },
  GREEN:    { color: '#16A34A', bg: '#DCFCE7', ar: 'أخضر',   en: 'Green' },
  YELLOW:   { color: '#D97706', bg: '#FEF3C7', ar: 'أصفر',   en: 'Yellow' },
  RED:      { color: '#DC2626', bg: '#FEE2E2', ar: 'أحمر',   en: 'Red' },
};

function normalizePct(v: number | undefined): number {
  if (typeof v !== 'number') return 0;
  if (v > 1) return v;
  return v * 100;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function NitaqatSimulatorPage() {
  const { lang } = useTranslation();
  const { error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  const [saudiHires, setSaudiHires] = useState('0');
  const [expatHires, setExpatHires] = useState('0');
  const [activityCode, setActivityCode] = useState('DEFAULT');
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    const sh = parseInt(saudiHires, 10) || 0;
    const eh = parseInt(expatHires, 10) || 0;
    if (sh === 0 && eh === 0) {
      toastError(_t('أدخل عدد توظيفات', 'Enter at least 1 hire'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/saudi/nitaqat/projection', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saudiHires: sh, expatHires: eh, activityCode }),
      });
      if (res.status === 401) { toastError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { toastError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ProjectionResult;
      setResult(data);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSaudiHires('0');
    setExpatHires('0');
    setResult(null);
  };

  const adjust = (key: 'saudi' | 'expat', delta: number) => {
    if (key === 'saudi') {
      const v = Math.max(0, (parseInt(saudiHires, 10) || 0) + delta);
      setSaudiHires(String(v));
    } else {
      const v = Math.max(0, (parseInt(expatHires, 10) || 0) + delta);
      setExpatHires(String(v));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════════════════════

  const currentBandKey = (result?.projection.currentBand || '').toUpperCase();
  const projBandKey = (result?.projection.projectedBand || '').toUpperCase();
  const currentBandMeta = BAND_META[currentBandKey] || BAND_META.YELLOW;
  const projBandMeta = BAND_META[projBandKey] || BAND_META.YELLOW;
  const currentPct = result ? (result.current.total > 0 ? (result.current.saudi / result.current.total) * 100 : 0) : 0;
  const newPct = result ? normalizePct(result.projection.newPct) : 0;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={28} color="#7C3AED" />
          {_t('محاكي النطاق (نطاقات)', 'Nitaqat Simulator')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          {_t(
            'احسب تأثير قرارات التوظيف على النطاق قبل تنفيذها — تجنب الوقوع في الأصفر/الأحمر',
            'Calculate the impact of hiring decisions on your Nitaqat band before executing — avoid Yellow/Red',
          )}
        </p>
      </div>

      {/* Simulation Form */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calculator size={18} color="#0F766E" />
          {_t('معاملات المحاكاة', 'Simulation Parameters')}
        </h3>

        <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
          {/* Saudi Hires */}
          <div className="input-group">
            <label className="input-label" htmlFor="sim-saudi" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#16A34A" />
              {_t('توظيفات سعوديين', 'Saudi Hires')}
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => adjust('saudi', -1)} aria-label={_t('انقص', 'Decrease')}>
                <Minus size={14} />
              </button>
              <input
                id="sim-saudi"
                type="number"
                min={0}
                className="input"
                value={saudiHires}
                onChange={(e) => setSaudiHires(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => adjust('saudi', 1)} aria-label={_t('زد', 'Increase')}>
                <Plus size={14} />
              </button>
            </div>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {_t('يحسّن النطاق', 'Improves band')}
            </small>
          </div>

          {/* Expat Hires */}
          <div className="input-group">
            <label className="input-label" htmlFor="sim-expat" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#D97706" />
              {_t('توظيفات وافدين', 'Expat Hires')}
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => adjust('expat', -1)} aria-label={_t('انقص', 'Decrease')}>
                <Minus size={14} />
              </button>
              <input
                id="sim-expat"
                type="number"
                min={0}
                className="input"
                value={expatHires}
                onChange={(e) => setExpatHires(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => adjust('expat', 1)} aria-label={_t('زد', 'Increase')}>
                <Plus size={14} />
              </button>
            </div>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {_t('قد يخفّض النطاق', 'May lower band')}
            </small>
          </div>

          {/* Activity Code */}
          <div className="input-group">
            <label className="input-label" htmlFor="sim-activity">{_t('النشاط الرمز', 'Activity Code')}</label>
            <select
              id="sim-activity"
              className="input"
              value={activityCode}
              onChange={(e) => setActivityCode(e.target.value)}
            >
              <option value="DEFAULT">DEFAULT</option>
              <option value="CONSTRUCTION">{_t('بناء', 'CONSTRUCTION')}</option>
              <option value="RETAIL">RETAIL</option>
              <option value="MANUFACTURING">MANUFACTURING</option>
              <option value="HOSPITALITY">HOSPITALITY</option>
              <option value="HEALTHCARE">HEALTHCARE</option>
              <option value="IT">IT</option>
            </select>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {_t('نسب النطاقات تختلف حسب النشاط', 'Band thresholds differ per activity')}
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleSimulate} disabled={loading}>
            <Calculator size={16} style={{ marginInlineEnd: '6px' }} />
            {loading ? _t('جاري الحساب...', 'Calculating...') : _t('محاكاة', 'Simulate')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={loading}>
            {_t('تصفير', 'Reset')}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Recommendation Banner */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: result.projection.improvement ? '#DCFCE7' : '#FEE2E2',
              border: `2px solid ${result.projection.improvement ? '#16A34A' : '#DC2626'}`,
              marginBottom: '20px',
            }}
            role="alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {result.projection.improvement ? (
                <CheckCircle2 size={36} color="#16A34A" />
              ) : (
                <XCircle size={36} color="#DC2626" />
              )}
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: result.projection.improvement ? '#15803D' : '#7F1D1D',
                  marginBottom: '4px',
                }}>
                  {result.projection.improvement
                    ? _t('توصية: نفّذ التوظيف ✓', 'Recommendation: Proceed with hiring ✓')
                    : _t('توصية: راجع قبل التنفيذ ⚠️', 'Recommendation: Review before hiring ⚠️')}
                </div>
                <p style={{ fontSize: '13px', color: result.projection.improvement ? '#15803D' : '#7F1D1D' }}>
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Before → After Comparison */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            {_t('المقارنة: قبل ← بعد', 'Comparison: Before → After')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            {/* Before */}
            <div className="card" style={{ padding: '20px', background: currentBandMeta.bg, borderInlineStart: `4px solid ${currentBandMeta.color}` }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                {_t('الحالي', 'Current')}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: currentBandMeta.color, lineHeight: 1, marginBottom: '8px' }}>
                {currentPct.toFixed(1)}%
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'white',
                color: currentBandMeta.color,
              }}>
                {_t(currentBandMeta.ar, currentBandMeta.en)}
              </span>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {_t(`${result.current.saudi} سعودي من ${result.current.total}`, `${result.current.saudi} Saudi of ${result.current.total}`)}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center' }}>
              {result.projection.improvement ? (
                <TrendingUp size={48} color="#16A34A" />
              ) : (
                <TrendingDown size={48} color="#DC2626" />
              )}
              <ArrowRight size={24} color="var(--text-muted)" style={{ display: 'block', margin: '4px auto', transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
            </div>

            {/* After */}
            <div className="card" style={{ padding: '20px', background: projBandMeta.bg, borderInlineStart: `4px solid ${projBandMeta.color}` }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                {_t('بعد التوظيف', 'After Hire')}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: projBandMeta.color, lineHeight: 1, marginBottom: '8px' }}>
                {newPct.toFixed(1)}%
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'white',
                color: projBandMeta.color,
              }}>
                {_t(projBandMeta.ar, projBandMeta.en)}
              </span>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {_t(`${result.projection.newSaudi} سعودي من ${result.projection.newTotal}`, `${result.projection.newSaudi} Saudi of ${result.projection.newTotal}`)}
              </div>
            </div>
          </div>

          {/* Quick scenarios */}
          <div className="card" style={{ padding: '16px', background: '#F9FAFB' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
              💡 {_t('سيناريوهات سريعة للتجربة:', 'Quick scenarios:')}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { s: 1, e: 0, label: _t('+1 سعودي', '+1 Saudi') },
                { s: 5, e: 0, label: _t('+5 سعوديين', '+5 Saudi') },
                { s: 0, e: 5, label: _t('+5 وافد', '+5 Expat') },
                { s: 2, e: 5, label: _t('2 سعودي + 5 وافد', '2 Saudi + 5 Expat') },
                { s: 10, e: 0, label: _t('+10 سعودي', '+10 Saudi') },
              ].map((scn, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSaudiHires(String(scn.s));
                    setExpatHires(String(scn.e));
                  }}
                  style={{ fontSize: '11px' }}
                >
                  {scn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Calculator size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('ابدأ بإدخال التوظيفات المقترحة', 'Enter proposed hires above')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {_t(
              'سيقوم النظام بحساب تأثيرها على النطاق الحالي وإعطاء توصية',
              'The system will compute the impact on your current band and recommend',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
