'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Rebates Dashboard — `/finance/rebates`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة الخصومات المؤجلة (End-of-period rebates):
 *   - SALES rebates    : خصومات نمنحها لكبار العملاء بناءً على حجم مبيعاتهم
 *   - PURCHASE rebates : خصومات نستحقها من موردين بناءً على حجم مشترياتنا منهم
 *
 *  الميزات:
 *   ✅ Batch calculate: حساب جماعي لكل الشركاء الذين تجاوزوا حد معين
 *   ✅ Single calculate: حساب لشريك محدد
 *   ✅ فلاتر بالنوع (SALES/PURCHASE) والفترة
 *   ✅ Export CSV
 *   ✅ Stats: إجمالي rebates، عدد الشركاء المستحقين
 *
 *  Permission: admin / owner / accountant / cfo / sales_manager
 *
 *  @see src/app/api/rebates/route.ts
 *  @see src/lib/rebate-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo } from 'react';
import {
  Gift,
  RefreshCw,
  Download,
  Calculator,
  TrendingUp,
  Users,
  XCircle,
  Calendar,
  Search as SearchIcon,
  Activity,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RebateResult {
  partnerId: number;
  partnerName?: string;
  totalVolume: number;
  totalValue: number;
  qualifiedTier: string;
  rebatePercent: number;
  rebateAmount: number;
}

interface BatchResponse {
  items: RebateResult[];
  count: number;
  period: { from: string; to: string };
}

type RebateType = 'SALES' | 'PURCHASE';

const TYPE_META: Record<RebateType, { ar: string; en: string; color: string }> = {
  SALES:    { ar: 'مبيعات (نمنح)',     en: 'Sales (Give)',     color: '#16A34A' },
  PURCHASE: { ar: 'مشتريات (نستحق)',  en: 'Purchase (Receive)', color: '#2563EB' },
};

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(n);
}

function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Helpers للتواريخ الافتراضية: آخر 90 يوم */
function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function RebatesPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State (form) ──────────────────────────────────────────────────────────
  const [type, setType] = useState<RebateType>('SALES');
  const [periodFrom, setPeriodFrom] = useState(defaultFrom());
  const [periodTo, setPeriodTo] = useState(defaultTo());
  const [minThreshold, setMinThreshold] = useState('50000');

  // ─── State (results) ──────────────────────────────────────────────────────
  const [items, setItems] = useState<RebateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // Single partner
  const [singlePartnerId, setSinglePartnerId] = useState('');
  const [singleResult, setSingleResult] = useState<RebateResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleBatch = async () => {
    if (!periodFrom || !periodTo) {
      toastError(_t('حدد الفترة', 'Specify period'));
      return;
    }
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const res = await fetch('/api/rebates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          type,
          periodFrom: new Date(periodFrom).toISOString(),
          periodTo: new Date(periodTo + 'T23:59:59').toISOString(),
          minThreshold: Number(minThreshold) || 0,
        }),
      });
      if (res.status === 403) { setError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as BatchResponse;
      setItems(data.items || []);
      toastSuccess(_t(`تم حساب ${data.count} شريك`, `Calculated ${data.count} partners`));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setError(_t(`فشل: ${msg}`, `Failed: ${msg}`));
    } finally {
      setLoading(false);
    }
  };

  const handleSingle = async () => {
    const pid = parseInt(singlePartnerId, 10);
    if (!pid || pid <= 0) {
      toastError(_t('معرّف الشريك غير صالح', 'Invalid partner ID'));
      return;
    }
    setSingleLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch('/api/rebates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: pid,
          type,
          periodFrom: new Date(periodFrom).toISOString(),
          periodTo: new Date(periodTo + 'T23:59:59').toISOString(),
        }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as RebateResult;
      setSingleResult(data);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSingleLoading(false);
    }
  };

  // ─── Filter results ───────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => [String(r.partnerId), r.partnerName ?? '', r.qualifiedTier]
      .join(' ').toLowerCase().includes(q));
  }, [items, searchInput]);

  /** Stats */
  const stats = useMemo(() => {
    const totalRebate = items.reduce((s, r) => s + r.rebateAmount, 0);
    const totalValue = items.reduce((s, r) => s + r.totalValue, 0);
    const totalVolume = items.reduce((s, r) => s + r.totalVolume, 0);
    return { totalRebate, totalValue, totalVolume, partnersCount: items.length };
  }, [items]);

  const handleExport = () => {
    if (!filteredItems.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = filteredItems.map((r) => ({
      PartnerID: r.partnerId,
      PartnerName: r.partnerName || '',
      TotalVolume: r.totalVolume,
      TotalValue: r.totalValue,
      QualifiedTier: r.qualifiedTier,
      RebatePercent: `${r.rebatePercent}%`,
      RebateAmount: r.rebateAmount,
    }));
    exportToCsv(`rebates-${type}-${periodFrom}-to-${periodTo}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift size={28} color="#D97706" />
            {_t('الخصومات المؤجلة (Rebates)', 'Rebates')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'حساب الخصومات المؤجلة لكبار العملاء والموردين بناءً على الحجم/القيمة في الفترة',
              'Calculate end-of-period rebates for top customers/suppliers based on volume/value',
            )}
          </p>
        </div>
      </div>

      {/* Controls Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calculator size={16} color="#0F766E" />
          {_t('إعدادات الحساب', 'Calculation Parameters')}
        </h3>

        <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="rb-type">{_t('النوع', 'Type')}</label>
            <select
              id="rb-type"
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as RebateType)}
            >
              {(Object.keys(TYPE_META) as RebateType[]).map((t) => (
                <option key={t} value={t}>{_t(TYPE_META[t].ar, TYPE_META[t].en)}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="rb-threshold">{_t('الحد الأدنى (ريال)', 'Min Threshold (SAR)')}</label>
            <input
              id="rb-threshold"
              type="number"
              min={0}
              className="input"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="rb-from">
              <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
              {_t('من', 'From')}
            </label>
            <input
              id="rb-from"
              type="date"
              className="input"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="rb-to">
              <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
              {_t('إلى', 'To')}
            </label>
            <input
              id="rb-to"
              type="date"
              className="input"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleBatch} disabled={loading}>
            {loading ? _t('جاري الحساب...', 'Calculating...') : (<><Activity size={16} style={{ marginInlineEnd: '6px' }} /> {_t('حساب جماعي', 'Batch Calculate')}</>)}
          </button>
        </div>
      </div>

      {/* Single Partner */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {_t('حساب لشريك واحد', 'Calculate for Single Partner')}
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input
            type="number"
            min={1}
            className="input"
            placeholder={_t('معرّف الشريك', 'Partner ID')}
            value={singlePartnerId}
            onChange={(e) => setSinglePartnerId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSingle(); }}
            style={{ width: '200px' }}
          />
          <button type="button" className="btn btn-secondary" onClick={handleSingle} disabled={singleLoading}>
            {singleLoading ? _t('جاري الحساب...', 'Calculating...') : _t('حساب', 'Calculate')}
          </button>
        </div>

        {singleResult && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#F0FDF4', border: '1px solid #16A34A', borderRadius: '8px' }}>
            <div className="grid-2" style={{ gap: '8px' }}>
              <Field label={_t('الشريك', 'Partner')} value={singleResult.partnerName || `#${singleResult.partnerId}`} />
              <Field label={_t('Tier المؤهل', 'Qualified Tier')} value={singleResult.qualifiedTier} />
              <Field label={_t('إجمالي القيمة', 'Total Value')} value={fmtSAR(singleResult.totalValue, lang)} />
              <Field label={_t('الكمية', 'Volume')} value={String(singleResult.totalVolume)} />
              <Field label={_t('نسبة الخصم', 'Rebate %')} value={`${singleResult.rebatePercent}%`} />
              <Field label={_t('قيمة الخصم', 'Rebate Amount')} value={fmtSAR(singleResult.rebateAmount, lang)} highlight />
            </div>
          </div>
        )}
      </div>

      {/* Batch Results */}
      {error && (
        <ErrorState message={error} onRetry={handleBatch} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}

      {items.length > 0 && (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <Users size={18} style={{ display: 'inline', marginInlineEnd: '6px' }} />
              {_t(`النتائج (${items.length} شريك)`, `Results (${items.length} partners)`)}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleExport}>
              <Download size={14} /> {_t('تصدير CSV', 'Export CSV')}
            </button>
          </h3>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <StatCard icon={<Users size={20} color="#2563EB" />} label={_t('عدد الشركاء', 'Partners')} value={String(stats.partnersCount)} bg="#EFF6FF" />
            <StatCard icon={<TrendingUp size={20} color="#16A34A" />} label={_t('إجمالي القيمة', 'Total Value')} value={fmtSAR(stats.totalValue, lang)} bg="#DCFCE7" />
            <StatCard icon={<Activity size={20} color="#7C3AED" />} label={_t('الكمية الكلية', 'Total Volume')} value={String(stats.totalVolume)} bg="#F3E8FF" />
            <StatCard icon={<Gift size={20} color="#D97706" />} label={_t('إجمالي الخصم', 'Total Rebate')} value={fmtSAR(stats.totalRebate, lang)} bg="#FEF3C7" />
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px', maxWidth: '400px' }}>
            <SearchIcon
              size={18}
              style={{
                position: 'absolute',
                [lang === 'ar' ? 'right' : 'left']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="search"
              className="input"
              placeholder={_t('ابحث برقم/اسم/tier...', 'Search by ID/name/tier...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
            />
          </div>

          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{_t('الشريك', 'Partner')}</th>
                  <th>{_t('Tier', 'Tier')}</th>
                  <th>{_t('القيمة', 'Value')}</th>
                  <th>{_t('الكمية', 'Volume')}</th>
                  <th>{_t('النسبة', 'Rate')}</th>
                  <th>{_t('قيمة الخصم', 'Rebate')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r) => (
                  <tr key={r.partnerId}>
                    <td style={{ fontWeight: 600 }}>#{r.partnerId}</td>
                    <td>{r.partnerName || '—'}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#DBEAFE', color: '#1E40AF' }}>
                        {r.qualifiedTier}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtSAR(r.totalValue, lang)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{r.totalVolume.toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{r.rebatePercent}%</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: TYPE_META[type].color }}>
                      {fmtSAR(r.rebateAmount, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Gift size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('لا توجد نتائج بعد', 'No results yet')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {_t(
              'حدد المعاملات بالأعلى ثم اضغط "حساب جماعي" للبدء.',
              'Set parameters above and click "Batch Calculate" to start.',
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: bg }}>
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function Field({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: highlight ? 'var(--primary)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}

function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#DC2626', border: '1px dashed #FCA5A5', background: '#FEF2F2' }} role="alert">
      <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p style={{ fontWeight: 600, marginBottom: '16px' }}>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <RefreshCw size={16} style={{ marginInlineEnd: '6px' }} /> {retryLabel}
      </button>
    </div>
  );
}
