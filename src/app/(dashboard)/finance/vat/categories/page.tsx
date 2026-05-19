'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VAT Categories Management — `/finance/vat/categories`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة فئات ضريبة القيمة المضافة للسعودية (15% أو 0% أو معفى).
 *
 *  فئات الـ ZATCA المعتمدة:
 *   - S  : Standard 15% (الافتراضي)
 *   - Z  : Zero-rated 0% (صادرات، أدوية، ذهب 99%)
 *   - E  : Exempt (عقار سكني، صحة، تعليم)
 *   - O  : Out of scope (خارج النطاق)
 *   - RC : Reverse Charge (B2B مستورد)
 *
 *  الميزات:
 *   ✅ عرض كل الفئات الحالية
 *   ✅ Seed defaults (إنشاء/تحديث الـ 5 فئات الافتراضية)
 *   ✅ Build VAT Return لفترة معينة (with breakdown)
 *   ✅ Export CSV
 *   ✅ Empty state إذا لم يتم seed بعد
 *   ✅ Permission-aware (admin / accountant / tax_officer)
 *
 *  @see src/app/api/vat/categories/route.ts
 *  @see src/lib/vat-classifier.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  RefreshCw,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  Calendar,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VatCategory {
  id: number;
  tenantId: string;
  code: string;                // S | Z | E | O | RC
  nameAr: string;
  nameEn: string;
  rate: number | string;       // Decimal as number from API
  zatcaCode: string;
  exemptionReasonRequired: boolean;
  isActive: boolean;
}

interface CategoriesResponse {
  items: VatCategory[];
  count: number;
}

interface VatReturn {
  period: { from: string; to: string };
  standard: { taxableAmount: number; vatAmount: number };
  zeroRated: { taxableAmount: number };
  exempt: { taxableAmount: number };
  totalSales: number;
  vatPayable: number;
  // قد تختلف بنية الـ engine — نعرض ما يوجد
  [key: string]: any;
}

/** أيقونة + لون لكل code */
const CODE_META: Record<string, { color: string; bg: string; label: string }> = {
  S:  { color: '#2563EB', bg: '#DBEAFE', label: 'Standard 15%' },
  Z:  { color: '#16A34A', bg: '#DCFCE7', label: 'Zero-rated' },
  E:  { color: '#7C3AED', bg: '#F3E8FF', label: 'Exempt' },
  O:  { color: '#64748B', bg: '#F1F5F9', label: 'Out of scope' },
  RC: { color: '#D97706', bg: '#FEF3C7', label: 'Reverse Charge' },
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

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function VatCategoriesPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<VatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // VAT Return state (نسخة الـ MTD)
  const [showReturn, setShowReturn] = useState(false);
  const [vatReturn, setVatReturn] = useState<VatReturn | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnFrom, setReturnFrom] = useState(() => {
    // الافتراضي: أول الشهر الحالي
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [returnTo, setReturnTo] = useState(() => new Date().toISOString().slice(0, 10));

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/vat/categories', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CategoriesResponse | VatCategory[];
      // API قد يرجع array مباشرة أو { items }
      const items = Array.isArray(data) ? data : data.items ?? [];
      setCategories(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSeed = async () => {
    if (!confirm(_t(
      'سيتم إنشاء/تحديث الفئات الافتراضية الـ 5 (S/Z/E/O/RC). متابعة؟',
      'Will create/update 5 default categories (S/Z/E/O/RC). Continue?',
    ))) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/vat/categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as { seeded: number; message?: string };
      toastSuccess(result.message || _t(`تم إنشاء ${result.seeded} فئة`, `Created ${result.seeded} categories`));
      await fetchCategories();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleBuildReturn = async () => {
    if (!returnFrom || !returnTo) {
      toastError(_t('حدد الفترة', 'Specify period'));
      return;
    }
    setReturnLoading(true);
    setVatReturn(null);
    try {
      const qs = new URLSearchParams({ from: returnFrom, to: returnTo });
      const res = await fetch(`/api/vat/categories?${qs.toString()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as VatReturn;
      setVatReturn(data);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleExportCategories = () => {
    if (!categories.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = categories.map((c) => ({
      Code: c.code,
      NameAr: c.nameAr,
      NameEn: c.nameEn,
      Rate: `${(Number(c.rate) * 100).toFixed(2)}%`,
      ZatcaCode: c.zatcaCode,
      ReasonRequired: c.exemptionReasonRequired ? 'YES' : 'NO',
      Active: c.isActive ? 'YES' : 'NO',
    }));
    exportToCsv('vat-categories.csv', rows);
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
            <Receipt size={28} color="#0F766E" />
            {_t('فئات ضريبة القيمة المضافة', 'VAT Categories')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'إدارة فئات VAT للسعودية مع رموز ZATCA المعتمدة (15% / 0% / معفى)',
              'Saudi VAT categories with ZATCA-approved codes (15% / 0% / Exempt)',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchCategories()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportCategories} disabled={loading || !categories.length}>
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowReturn(true)}>
            <Calculator size={18} /> {_t('بناء VAT Return', 'Build VAT Return')}
          </button>
          {categories.length === 0 && !loading && (
            <button type="button" className="btn btn-primary" onClick={handleSeed} disabled={seeding}>
              <Plus size={18} /> {seeding ? _t('جاري...', 'Seeding...') : _t('تهيئة الفئات الافتراضية', 'Seed Defaults')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && <TableSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchCategories()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}

      {!loading && !loadError && categories.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Receipt size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('لم يتم تهيئة الفئات بعد', 'Categories not seeded yet')}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {_t(
              'اضغط "تهيئة الفئات الافتراضية" لإنشاء 5 فئات معتمدة من ZATCA.',
              'Click "Seed Defaults" to create 5 ZATCA-approved categories.',
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleSeed} disabled={seeding}>
            <Plus size={16} style={{ marginInlineEnd: '6px' }} />
            {seeding ? _t('جاري التهيئة...', 'Seeding...') : _t('تهيئة الفئات الافتراضية', 'Seed Defaults')}
          </button>
        </div>
      )}

      {!loading && !loadError && categories.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{_t('الرمز', 'Code')}</th>
                <th>{_t('الاسم', 'Name')}</th>
                <th>{_t('النسبة', 'Rate')}</th>
                <th>{_t('رمز ZATCA', 'ZATCA Code')}</th>
                <th>{_t('سبب الإعفاء؟', 'Reason Required?')}</th>
                <th>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const meta = CODE_META[c.code] || { color: '#64748B', bg: '#F1F5F9', label: c.code };
                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: meta.bg, color: meta.color }}>
                        {c.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lang === 'ar' ? c.nameAr : c.nameEn}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{lang === 'ar' ? c.nameEn : c.nameAr}</small>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {(Number(c.rate) * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {c.zatcaCode}
                    </td>
                    <td>
                      {c.exemptionReasonRequired ? (
                        <span style={{ color: '#D97706', fontSize: '12px' }}>
                          <AlertTriangle size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                          {_t('مطلوب', 'Required')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {c.isActive ? (
                        <span style={{ color: '#16A34A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {_t('نشط', 'Active')}
                        </span>
                      ) : (
                        <span style={{ color: '#DC2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> {_t('معطل', 'Inactive')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VAT Return Modal */}
      {showReturn && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>
                <Calculator size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('بناء VAT Return', 'Build VAT Return')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowReturn(false); setVatReturn(null); }} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end', marginBottom: '20px' }}>
                <div className="input-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="input-label" htmlFor="vr-from">
                    <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                    {_t('من', 'From')}
                  </label>
                  <input
                    id="vr-from"
                    type="date"
                    className="input"
                    value={returnFrom}
                    onChange={(e) => setReturnFrom(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="input-label" htmlFor="vr-to">
                    <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                    {_t('إلى', 'To')}
                  </label>
                  <input
                    id="vr-to"
                    type="date"
                    className="input"
                    value={returnTo}
                    onChange={(e) => setReturnTo(e.target.value)}
                  />
                </div>
                <button type="button" className="btn btn-primary" onClick={handleBuildReturn} disabled={returnLoading}>
                  {returnLoading ? _t('جاري الحساب...', 'Calculating...') : _t('بناء التقرير', 'Build')}
                </button>
              </div>

              {vatReturn && (
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                    <FileText size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                    {_t('نتيجة الإقرار', 'Return Result')}
                  </h3>
                  <pre
                    style={{
                      fontSize: '12px',
                      background: 'white',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '400px',
                      direction: 'ltr',
                      textAlign: 'left',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {JSON.stringify(vatReturn, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowReturn(false); setVatReturn(null); }}>
                {_t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }} aria-busy="true">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            height: '48px',
            background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
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
