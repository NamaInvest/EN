'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Credit Check Dashboard — `/finance/credit-check`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  لوحة فحص الائتمان للعملاء.
 *  3 تبويبات:
 *   1. At-Risk Customers — قائمة العملاء قرب أو فوق حد الائتمان
 *   2. Single Customer   — فحص فوري لعميل واحد بالـ ID
 *   3. Decision Simulator — اختبار "هل يستطيع عميل X تحمل مبلغ Y؟"
 *
 *  Enterprise UX (15 ميزة):
 *   ✅ Tab navigation + 3 modes
 *   ✅ Search/Filter
 *   ✅ Threshold selector (50%/70%/80%/90%/100%)
 *   ✅ Stats summary
 *   ✅ Export CSV
 *   ✅ Decision card مع visual indicator
 *   ✅ Utilization bar مع color coding
 *   ✅ Permission-aware (403)
 *   ✅ All standard states
 *
 *  Permission: admin / owner / accountant / cfo / sales_manager
 *
 *  @see src/app/api/credit-check/route.ts
 *  @see src/lib/credit-check-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Download,
  Search as SearchIcon,
  TrendingDown,
  TrendingUp,
  XCircle,
  CheckCircle2,
  DollarSign,
  Users,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types (متطابقة مع API contract) ──────────────────────────────────────────

interface CreditCheckResult {
  customerId: number;
  customerName: string;
  creditLimit: number;
  openBalance: number;
  pendingOrders: number;
  totalExposure: number;
  availableCredit: number;
  isOverLimit: boolean;
  overLimitAmount: number;
  overrideAllowed: boolean;
}

interface AtRiskResponse {
  items: CreditCheckResult[];
  threshold: number;
  count: number;
}

interface DecisionResult extends CreditCheckResult {
  canProceed: boolean;
  reason: string | null;
}

/** يصيغ المبلغ بالعملة السعودية بتنسيق محلي */
function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(n);
}

/** يحسب نسبة الاستخدام (0..1) — لو الحد صفر نرجع صفر */
function utilizationPct(r: CreditCheckResult): number {
  if (r.creditLimit <= 0) return 0;
  return Math.min(1, r.totalExposure / r.creditLimit);
}

/** يحدد لون شريط الاستخدام حسب النسبة */
function utilColor(pct: number): string {
  if (pct >= 1) return '#DC2626';
  if (pct >= 0.8) return '#D97706';
  if (pct >= 0.6) return '#EAB308';
  return '#16A34A';
}

/** تصدير CSV — نفس النمط في الصفحات الأخرى */
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

export default function CreditCheckPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────

  /** Tab النشط: at-risk / single / decision */
  const [tab, setTab] = useState<'at-risk' | 'single' | 'decision'>('at-risk');

  // At-risk list
  const [atRiskItems, setAtRiskItems] = useState<CreditCheckResult[]>([]);
  const [threshold, setThreshold] = useState(0.8);
  const [loadingAtRisk, setLoadingAtRisk] = useState(false);
  const [atRiskError, setAtRiskError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);

  // Single customer check
  const [singleCustomerId, setSingleCustomerId] = useState('');
  const [singleResult, setSingleResult] = useState<CreditCheckResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // Decision simulator
  const [decCustomerId, setDecCustomerId] = useState('');
  const [decAmount, setDecAmount] = useState('');
  const [decResult, setDecResult] = useState<DecisionResult | null>(null);
  const [decLoading, setDecLoading] = useState(false);

  // ─── Fetch: At-Risk list ──────────────────────────────────────────────────

  const fetchAtRisk = useCallback(async (): Promise<void> => {
    setLoadingAtRisk(true);
    setAtRiskError(null);
    try {
      const res = await fetch(`/api/credit-check?action=at-risk&threshold=${threshold}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setAtRiskError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setAtRiskError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AtRiskResponse;
      setAtRiskItems(data.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setAtRiskError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoadingAtRisk(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, lang]);

  // إعادة جلب عند فتح tab أو تغيير threshold
  useEffect(() => { if (tab === 'at-risk') void fetchAtRisk(); }, [tab, fetchAtRisk]);

  // ─── Search filter (client-side) ──────────────────────────────────────────

  const filteredAtRisk = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return atRiskItems;
    return atRiskItems.filter((c) =>
      [String(c.customerId), c.customerName].join(' ').toLowerCase().includes(q),
    );
  }, [atRiskItems, deferredSearch]);

  /** إحصاءات الـ At-Risk */
  const stats = useMemo(() => {
    const total = atRiskItems.length;
    const overLimit = atRiskItems.filter((c) => c.isOverLimit).length;
    const totalExposure = atRiskItems.reduce((sum, c) => sum + c.totalExposure, 0);
    const totalAvailable = atRiskItems.reduce((sum, c) => sum + c.availableCredit, 0);
    return { total, overLimit, totalExposure, totalAvailable };
  }, [atRiskItems]);

  // ─── Single customer check ────────────────────────────────────────────────

  const checkSingle = async () => {
    const id = parseInt(singleCustomerId, 10);
    if (!id || id <= 0) {
      toastError(_t('معرّف العميل غير صالح', 'Invalid customer ID'));
      return;
    }
    setSingleLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch(`/api/credit-check?customerId=${id}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as CreditCheckResult;
      setSingleResult(result);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSingleLoading(false);
    }
  };

  // ─── Decision simulator ───────────────────────────────────────────────────

  const checkDecision = async () => {
    const id = parseInt(decCustomerId, 10);
    const amt = parseFloat(decAmount);
    if (!id || id <= 0) { toastError(_t('معرّف العميل غير صالح', 'Invalid customer ID')); return; }
    if (!amt || amt <= 0) { toastError(_t('المبلغ غير صالح', 'Invalid amount')); return; }

    setDecLoading(true);
    setDecResult(null);
    try {
      const res = await fetch('/api/credit-check', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id, amount: amt }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as DecisionResult;
      setDecResult(result);
      if (result.canProceed) toastSuccess(_t('يمكن المتابعة', 'Can proceed'));
      else toastError(_t('سيتجاوز حد الائتمان', 'Will exceed credit limit'));
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setDecLoading(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  const handleExportAtRisk = () => {
    if (!filteredAtRisk.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = filteredAtRisk.map((c) => ({
      CustomerID: c.customerId,
      Name: c.customerName,
      CreditLimit: c.creditLimit,
      OpenBalance: c.openBalance,
      PendingOrders: c.pendingOrders,
      TotalExposure: c.totalExposure,
      AvailableCredit: c.availableCredit,
      UtilizationPct: Math.round(utilizationPct(c) * 100),
      IsOverLimit: c.isOverLimit ? 'YES' : 'NO',
      OverLimitAmount: c.overLimitAmount,
    }));
    exportToCsv(`at-risk-customers-${new Date().toISOString().slice(0, 10)}.csv`, rows);
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
            <ShieldCheck size={28} color="#0F766E" />
            {_t('فحص الائتمان', 'Credit Check')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'فحص حدود الائتمان فورياً قبل إصدار الفواتير ومراقبة العملاء قرب الحد',
              'Real-time credit checks before invoicing + monitor at-risk customers',
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
        role="tablist"
      >
        <TabButton active={tab === 'at-risk'} onClick={() => setTab('at-risk')} label={_t('العملاء بالخطر', 'At-Risk Customers')} icon={<AlertTriangle size={16} />} />
        <TabButton active={tab === 'single'} onClick={() => setTab('single')} label={_t('فحص عميل', 'Single Customer')} icon={<SearchIcon size={16} />} />
        <TabButton active={tab === 'decision'} onClick={() => setTab('decision')} label={_t('محاكي القرار', 'Decision Simulator')} icon={<DollarSign size={16} />} />
      </div>

      {/* ─── At-Risk Tab ──────────────────────────────────────────────────── */}
      {tab === 'at-risk' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              {_t('عتبة الاستخدام:', 'Utilization threshold:')}
              <select
                className="input"
                value={String(threshold)}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100px' }}
                aria-label={_t('عتبة الاستخدام', 'Threshold')}
              >
                <option value="0.5">50%</option>
                <option value="0.7">70%</option>
                <option value="0.8">80%</option>
                <option value="0.9">90%</option>
                <option value="1">100%</option>
              </select>
            </label>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
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
                placeholder={_t('ابحث برقم/اسم العميل...', 'Search by ID/name...')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
                aria-label={_t('بحث', 'Search')}
              />
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => void fetchAtRisk()} aria-label={_t('تحديث', 'Refresh')}>
              <RefreshCw size={18} className={loadingAtRisk ? 'cc-spin' : ''} />
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleExportAtRisk} disabled={loadingAtRisk || !filteredAtRisk.length}>
              <Download size={18} /> {_t('تصدير', 'Export')}
            </button>
          </div>

          {/* Stats */}
          {atRiskItems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <StatCard icon={<Users size={20} color="#2563EB" />} label={_t('عملاء بالخطر', 'At-Risk')} value={String(stats.total)} bg="#EFF6FF" />
              <StatCard icon={<XCircle size={20} color="#DC2626" />} label={_t('تجاوزوا الحد', 'Over Limit')} value={String(stats.overLimit)} bg="#FEE2E2" />
              <StatCard icon={<TrendingUp size={20} color="#D97706" />} label={_t('إجمالي التعرض', 'Total Exposure')} value={fmtSAR(stats.totalExposure, lang)} bg="#FEF3C7" />
              <StatCard icon={<TrendingDown size={20} color="#16A34A" />} label={_t('إجمالي المتاح', 'Total Available')} value={fmtSAR(stats.totalAvailable, lang)} bg="#DCFCE7" />
            </div>
          )}

          {/* Content */}
          {loadingAtRisk && <TableSkeleton />}
          {!loadingAtRisk && atRiskError && (
            <ErrorState message={atRiskError} onRetry={() => void fetchAtRisk()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
          )}
          {!loadingAtRisk && !atRiskError && filteredAtRisk.length === 0 && (
            <EmptyState
              icon={<ShieldCheck size={48} color="#16A34A" />}
              title={_t('لا يوجد عملاء بالخطر', 'No at-risk customers')}
              message={_t(`جميع العملاء تحت ${Math.round(threshold * 100)}% من حدودهم.`, `All customers below ${Math.round(threshold * 100)}% of limits.`)}
            />
          )}
          {!loadingAtRisk && !atRiskError && filteredAtRisk.length > 0 && (
            <div className="card" style={{ overflow: 'auto' }}>
              <table className="table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{_t('العميل', 'Customer')}</th>
                    <th>{_t('الحد', 'Limit')}</th>
                    <th>{_t('رصيد مفتوح', 'Open Balance')}</th>
                    <th>{_t('أوامر معلقة', 'Pending')}</th>
                    <th>{_t('التعرض', 'Exposure')}</th>
                    <th>{_t('الاستخدام', 'Utilization')}</th>
                    <th>{_t('الحالة', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtRisk.map((c) => (
                    <AtRiskRow key={c.customerId} customer={c} lang={lang} _t={_t} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── Single Tab ───────────────────────────────────────────────────── */}
      {tab === 'single' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {_t('فحص ائتمان عميل', 'Customer Credit Check')}
          </h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="number"
              className="input"
              placeholder={_t('معرّف العميل', 'Customer ID')}
              min={1}
              value={singleCustomerId}
              onChange={(e) => setSingleCustomerId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void checkSingle(); }}
              style={{ width: '200px' }}
              aria-label={_t('معرّف العميل', 'Customer ID')}
            />
            <button type="button" className="btn btn-primary" onClick={checkSingle} disabled={singleLoading}>
              {singleLoading ? _t('جارٍ الفحص...', 'Checking...') : _t('فحص', 'Check')}
            </button>
          </div>

          {singleResult && <CreditDetailCard r={singleResult} lang={lang} _t={_t} />}
        </div>
      )}

      {/* ─── Decision Tab ─────────────────────────────────────────────────── */}
      {tab === 'decision' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {_t('محاكي قرار الائتمان', 'Credit Decision Simulator')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            {_t(
              'محاكاة: هل يستطيع العميل تحمل فاتورة بقيمة معينة؟',
              'Simulate: Can a customer afford an invoice of a given amount?',
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="number"
              className="input"
              placeholder={_t('معرّف العميل', 'Customer ID')}
              min={1}
              value={decCustomerId}
              onChange={(e) => setDecCustomerId(e.target.value)}
              style={{ width: '200px' }}
              aria-label={_t('معرّف العميل', 'Customer ID')}
            />
            <input
              type="number"
              className="input"
              placeholder={_t('المبلغ بالريال', 'Amount in SAR')}
              min={0.01}
              step="0.01"
              value={decAmount}
              onChange={(e) => setDecAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void checkDecision(); }}
              style={{ width: '200px' }}
              aria-label={_t('المبلغ', 'Amount')}
            />
            <button type="button" className="btn btn-primary" onClick={checkDecision} disabled={decLoading}>
              {decLoading ? _t('جارٍ الفحص...', 'Checking...') : _t('فحص القرار', 'Check Decision')}
            </button>
          </div>

          {decResult && (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: decResult.canProceed ? '#DCFCE7' : '#FEE2E2',
                  border: `2px solid ${decResult.canProceed ? '#16A34A' : '#DC2626'}`,
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                role="alert"
              >
                {decResult.canProceed ? <CheckCircle2 size={32} color="#16A34A" /> : <XCircle size={32} color="#DC2626" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: decResult.canProceed ? '#15803D' : '#7F1D1D' }}>
                    {decResult.canProceed
                      ? _t('يمكن المتابعة ✓', 'Can Proceed ✓')
                      : _t('سيتجاوز الحد ✗', 'Will Exceed Limit ✗')}
                  </div>
                  {decResult.reason && (
                    <div style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '4px' }}>{decResult.reason}</div>
                  )}
                </div>
              </div>
              <CreditDetailCard r={decResult} lang={lang} _t={_t} />
            </div>
          )}
        </div>
      )}

      <style>{`.cc-spin { animation: cc-spin 1s linear infinite; } @keyframes cc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function TabButton({
  active, onClick, label, icon,
}: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
        marginBottom: '-1px',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

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

function AtRiskRow({
  customer: c, lang, _t,
}: { customer: CreditCheckResult; lang: string; _t: (ar: string, en: string) => string }) {
  const pct = utilizationPct(c);
  const color = utilColor(pct);

  return (
    <tr style={c.isOverLimit ? { background: '#FEF2F220' } : undefined}>
      <td style={{ fontWeight: 600 }}>#{c.customerId}</td>
      <td>{c.customerName || '—'}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtSAR(c.creditLimit, lang)}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtSAR(c.openBalance, lang)}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtSAR(c.pendingOrders, lang)}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>{fmtSAR(c.totalExposure, lang)}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '80px', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', background: color }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color }}>{Math.round(pct * 100)}%</span>
        </div>
      </td>
      <td>
        {c.isOverLimit ? (
          <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>
            {_t('تجاوز', 'Over')}
          </span>
        ) : (
          <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#D97706' }}>
            {_t('قريب', 'Near')}
          </span>
        )}
      </td>
    </tr>
  );
}

function CreditDetailCard({
  r, lang, _t,
}: { r: CreditCheckResult; lang: string; _t: (ar: string, en: string) => string }) {
  const pct = utilizationPct(r);
  return (
    <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {r.customerName || _t(`عميل #${r.customerId}`, `Customer #${r.customerId}`)}
        {r.isOverLimit && <XCircle size={18} color="#DC2626" />}
      </h4>

      <div className="grid-2" style={{ gap: '12px' }}>
        <DetailField label={_t('الحد الائتماني', 'Credit Limit')} value={fmtSAR(r.creditLimit, lang)} />
        <DetailField label={_t('رصيد مفتوح', 'Open Balance')} value={fmtSAR(r.openBalance, lang)} />
        <DetailField label={_t('أوامر معلقة', 'Pending Orders')} value={fmtSAR(r.pendingOrders, lang)} />
        <DetailField label={_t('التعرض الكلي', 'Total Exposure')} value={fmtSAR(r.totalExposure, lang)} highlight />
        <DetailField label={_t('المتاح', 'Available')} value={fmtSAR(r.availableCredit, lang)} highlight={!r.isOverLimit} />
        {r.isOverLimit && <DetailField label={_t('مبلغ التجاوز', 'Over Limit')} value={fmtSAR(r.overLimitAmount, lang)} danger />}
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{_t('نسبة الاستخدام', 'Utilization')}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: utilColor(pct) }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', background: utilColor(pct), transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label, value, highlight = false, danger = false,
}: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  const color = danger ? '#DC2626' : highlight ? 'var(--primary)' : 'var(--text)';
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }} aria-busy="true">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            height: '40px',
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

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{message}</p>
    </div>
  );
}
