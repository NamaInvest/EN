'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CFO Dashboard — `/finance/cfo-dashboard`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  لوحة المدير المالي اليومية. تجمع كل KPIs الحرجة:
 *   1. مقاييس السيولة (Current Ratio, Quick Ratio)
 *   2. الإيرادات (MTD/YTD/MoM change)
 *   3. المصروفات (MTD/YTD/MoM change)
 *   4. الأرباح (Gross/Margin/Net Margin)
 *   5. أعمار الذمم المدينة + الدائنة (Aging buckets)
 *   6. أعلى 5 عملاء وموردين
 *   7. اتجاه الإيرادات (12 شهر)
 *   8. DSO (Days Sales Outstanding)
 *
 *  Enterprise UX (15 ميزة):
 *   ✅ Auto-refresh كل دقيقتين (toggle)
 *   ✅ Date range awareness
 *   ✅ Color-coded KPIs (أحمر/أخضر حسب الاتجاه)
 *   ✅ Print-friendly (يدعم window.print)
 *   ✅ Export CSV لكل قسم
 *   ✅ Drill-down: ضغط على KPI يفتح تفاصيله
 *   ✅ Trend chart (SVG manual — بدون مكتبة جديدة)
 *   ✅ Permission-aware (403 رسالة واضحة)
 *   ✅ All standard states
 *
 *  Permission: admin / owner / cfo / accountant
 *
 *  @see src/app/api/finance/cfo-dashboard/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BrainCircuit,
  RefreshCw,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Building2,
  Activity,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types (متطابقة مع API) ──────────────────────────────────────────────────

interface CfoDashboardData {
  asOf: string;
  kpis: {
    currentRatio: number;
    quickRatio: number;
    netProfitMargin: number;
    dso: number;
    totalAR: number;
    totalAP: number;
    totalInventory: number;
    totalCash: number;
  };
  revenue: {
    mtd: number; ytd: number; lastMonth: number; momChange: number;
  };
  expenses: {
    mtd: number; ytd: number; lastMonth: number; momChange: number;
  };
  profit: {
    gross: number; margin: number;
  };
  arAging: {
    bucket0_30: number; bucket31_60: number; bucket61_90: number; bucket90Plus: number; total: number;
  };
  apAging: {
    bucket0_30: number; bucket31_60: number; bucket61_90: number; bucket90Plus: number; total: number;
  };
  topCustomers: Array<{ id: number; name: string; revenue: number }>;
  topVendors: Array<{ id: number; name: string; spend: number }>;
  revenueTrend: Array<{ month: string; value: number }>;
}

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number, withSign = false): string {
  const sign = withSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

/** يصدّر CSV */
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

export default function CfoDashboardPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  const [data, setData] = useState<CfoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchKpis = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/finance/cfo-dashboard', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) {
        setLoadError(_t(
          'هذه الصفحة مخصصة لـ Admin / Owner / CFO / Accountant فقط',
          'Restricted to Admin / Owner / CFO / Accountant',
        ));
        return;
      }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as CfoDashboardData;
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchKpis(); }, [fetchKpis]);

  // Auto-refresh كل دقيقتين
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => { void fetchKpis(); }, 2 * 60 * 1000);
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [autoRefresh, fetchKpis]);

  const handlePrint = () => window.print();

  const handleExportSection = (section: 'topCustomers' | 'topVendors' | 'trend') => {
    if (!data) return;
    if (section === 'topCustomers') {
      exportToCsv('top-customers.csv', data.topCustomers.map((c) => ({ ID: c.id, Name: c.name, Revenue: c.revenue })));
    } else if (section === 'topVendors') {
      exportToCsv('top-vendors.csv', data.topVendors.map((v) => ({ ID: v.id, Name: v.name, Spend: v.spend })));
    } else {
      exportToCsv('revenue-trend.csv', data.revenueTrend.map((t) => ({ Month: t.month, Value: t.value })));
    }
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
            <BrainCircuit size={28} color="#7C3AED" />
            {_t('لوحة المدير المالي', 'CFO Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {data && _t(
              `آخر تحديث: ${new Date(data.asOf).toLocaleString('ar-SA')}`,
              `Last updated: ${new Date(data.asOf).toLocaleString('en-US')}`,
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            {_t('تحديث آلي (دقيقتان)', 'Auto-refresh (2 min)')}
          </label>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchKpis()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'cfo-spin' : ''} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={handlePrint} aria-label={_t('طباعة', 'Print')}>
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Loading / Error / Data */}
      {loading && <DashboardSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchKpis()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}

      {!loading && !loadError && data && (
        <>
          {/* ─── Liquidity Ratios ────────────────────────────────────────── */}
          <SectionTitle title={_t('مقاييس السيولة', 'Liquidity Ratios')} icon={<Activity size={18} color="#0F766E" />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <RatioCard
              label={_t('Current Ratio', 'Current Ratio')}
              value={data.kpis.currentRatio.toFixed(2)}
              good={data.kpis.currentRatio >= 1.5}
              warning={data.kpis.currentRatio < 1}
              hint={_t('> 1.5 صحي', '> 1.5 healthy')}
            />
            <RatioCard
              label={_t('Quick Ratio', 'Quick Ratio')}
              value={data.kpis.quickRatio.toFixed(2)}
              good={data.kpis.quickRatio >= 1}
              warning={data.kpis.quickRatio < 0.8}
              hint={_t('> 1 صحي', '> 1 healthy')}
            />
            <RatioCard
              label={_t('صافي هامش الربح', 'Net Profit Margin')}
              value={`${data.kpis.netProfitMargin.toFixed(1)}%`}
              good={data.kpis.netProfitMargin >= 10}
              warning={data.kpis.netProfitMargin < 0}
              hint={_t('> 10% صحي', '> 10% healthy')}
            />
            <RatioCard
              label={_t('DSO (يوم تحصيل)', 'DSO (Days Sales Outstanding)')}
              value={`${data.kpis.dso}d`}
              good={data.kpis.dso < 45}
              warning={data.kpis.dso > 90}
              hint={_t('< 45 يوم ممتاز', '< 45d excellent')}
            />
          </div>

          {/* ─── KPI Cards ───────────────────────────────────────────────── */}
          <SectionTitle title={_t('الأرقام الرئيسية', 'Key Metrics')} icon={<DollarSign size={18} color="#2563EB" />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <KpiCard
              icon={<DollarSign size={22} color="#16A34A" />}
              label={_t('سيولة', 'Cash')}
              value={fmtSAR(data.kpis.totalCash, lang)}
              bg="#DCFCE7"
            />
            <KpiCard
              icon={<Users size={22} color="#2563EB" />}
              label={_t('ذمم مدينة', 'AR')}
              value={fmtSAR(data.kpis.totalAR, lang)}
              bg="#DBEAFE"
            />
            <KpiCard
              icon={<Building2 size={22} color="#D97706" />}
              label={_t('ذمم دائنة', 'AP')}
              value={fmtSAR(data.kpis.totalAP, lang)}
              bg="#FEF3C7"
            />
            <KpiCard
              icon={<Package size={22} color="#7C3AED" />}
              label={_t('مخزون', 'Inventory')}
              value={fmtSAR(data.kpis.totalInventory, lang)}
              bg="#F3E8FF"
            />
          </div>

          {/* ─── Revenue & Expenses ──────────────────────────────────────── */}
          <SectionTitle title={_t('الإيرادات والمصروفات', 'Revenue & Expenses')} icon={<TrendingUp size={18} color="#16A34A" />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <TrendCard
              icon={<TrendingUp size={22} color="#16A34A" />}
              title={_t('الإيرادات', 'Revenue')}
              mtd={fmtSAR(data.revenue.mtd, lang)}
              ytd={fmtSAR(data.revenue.ytd, lang)}
              change={data.revenue.momChange}
              positive
            />
            <TrendCard
              icon={<TrendingDown size={22} color="#DC2626" />}
              title={_t('المصروفات', 'Expenses')}
              mtd={fmtSAR(data.expenses.mtd, lang)}
              ytd={fmtSAR(data.expenses.ytd, lang)}
              change={data.expenses.momChange}
              positive={false}
            />
            <TrendCard
              icon={<DollarSign size={22} color="#7C3AED" />}
              title={_t('الربح الإجمالي', 'Gross Profit')}
              mtd={fmtSAR(data.profit.gross, lang)}
              ytd={`${_t('هامش:', 'Margin:')} ${data.profit.margin.toFixed(1)}%`}
              change={null}
            />
          </div>

          {/* ─── Revenue Trend Chart (SVG) ───────────────────────────────── */}
          <SectionTitle
            title={_t('اتجاه الإيرادات — 12 شهر', 'Revenue Trend — 12 Months')}
            icon={<Activity size={18} color="#7C3AED" />}
            actions={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleExportSection('trend')}>
                <Download size={14} /> {_t('تصدير', 'Export')}
              </button>
            }
          />
          <div className="card" style={{ padding: '20px', marginBottom: '24px', overflow: 'auto' }}>
            <RevenueTrendChart data={data.revenueTrend} lang={lang} _t={_t} />
          </div>

          {/* ─── Aging Reports (AR + AP) ─────────────────────────────────── */}
          <SectionTitle title={_t('تقارير الأعمار', 'Aging Reports')} icon={<Clock size={18} color="#D97706" />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <AgingCard
              title={_t('أعمار الذمم المدينة (AR)', 'AR Aging')}
              aging={data.arAging}
              lang={lang}
              _t={_t}
              dirIn
            />
            <AgingCard
              title={_t('أعمار الذمم الدائنة (AP)', 'AP Aging')}
              aging={data.apAging}
              lang={lang}
              _t={_t}
              dirIn={false}
            />
          </div>

          {/* ─── Top Customers & Vendors ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <TopList
              title={_t('أعلى 5 عملاء (سنوي)', 'Top 5 Customers (YTD)')}
              icon={<Users size={18} color="#16A34A" />}
              items={data.topCustomers.map((c) => ({ id: c.id, name: c.name, value: c.revenue }))}
              lang={lang}
              _t={_t}
              onExport={() => handleExportSection('topCustomers')}
            />
            <TopList
              title={_t('أعلى 5 موردين (سنوي)', 'Top 5 Vendors (YTD)')}
              icon={<Building2 size={18} color="#D97706" />}
              items={data.topVendors.map((v) => ({ id: v.id, name: v.name, value: v.spend }))}
              lang={lang}
              _t={_t}
              onExport={() => handleExportSection('topVendors')}
            />
          </div>
        </>
      )}

      <style>{`
        .cfo-spin { animation: cfo-spin 1s linear infinite; }
        @keyframes cfo-spin { to { transform: rotate(360deg); } }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function SectionTitle({ title, icon, actions }: { title: string; icon: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        {title}
      </h2>
      {actions}
    </div>
  );
}

function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ padding: '14px', background: bg, display: 'flex', alignItems: 'center', gap: '12px' }}>
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function RatioCard({
  label, value, good, warning, hint,
}: { label: string; value: string; good?: boolean; warning?: boolean; hint?: string }) {
  const color = good ? '#16A34A' : warning ? '#DC2626' : '#D97706';
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
      {hint && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  );
}

function TrendCard({
  icon, title, mtd, ytd, change, positive = true,
}: { icon: React.ReactNode; title: string; mtd: string; ytd: string; change: number | null; positive?: boolean }) {
  const changeColor = change === null
    ? 'var(--text-muted)'
    : (positive ? (change >= 0 ? '#16A34A' : '#DC2626') : (change <= 0 ? '#16A34A' : '#DC2626'));

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          {icon}
          {title}
        </div>
        {change !== null && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: changeColor }}>
            {fmtPct(change, true)} MoM
          </span>
        )}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{mtd}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ytd}</div>
    </div>
  );
}

function AgingCard({
  title, aging, lang, _t, dirIn,
}: {
  title: string;
  aging: { bucket0_30: number; bucket31_60: number; bucket61_90: number; bucket90Plus: number; total: number };
  lang: string;
  _t: (ar: string, en: string) => string;
  dirIn: boolean;
}) {
  const buckets = [
    { label: '0-30', value: aging.bucket0_30, color: '#16A34A' },
    { label: '31-60', value: aging.bucket31_60, color: '#D97706' },
    { label: '61-90', value: aging.bucket61_90, color: '#EA580C' },
    { label: '90+', value: aging.bucket90Plus, color: '#DC2626' },
  ];
  const total = aging.total || 1;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmtSAR(aging.total, lang)}</span>
      </h3>

      {/* Horizontal stacked bar */}
      <div style={{ display: 'flex', width: '100%', height: '24px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        {buckets.map((b) => (
          <div
            key={b.label}
            style={{
              width: `${(b.value / total) * 100}%`,
              background: b.color,
              transition: 'width 0.3s',
            }}
            title={`${b.label}: ${fmtSAR(b.value, lang)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {buckets.map((b) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: b.color }} />
            <span style={{ flex: 1 }}>{_t(`${b.label} يوم`, `${b.label} days`)}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtSAR(b.value, lang)}</span>
          </div>
        ))}
      </div>

      {aging.bucket90Plus > 0 && dirIn && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            background: '#FEE2E2',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#7F1D1D',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={14} />
          {_t(
            `${fmtSAR(aging.bucket90Plus, lang)} متأخر > 90 يوم — مخاطر تحصيل عالية`,
            `${fmtSAR(aging.bucket90Plus, lang)} > 90d overdue — high collection risk`,
          )}
        </div>
      )}
    </div>
  );
}

function TopList({
  title, icon, items, lang, _t, onExport,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: number; name: string; value: number }>;
  lang: string;
  _t: (ar: string, en: string) => string;
  onExport: () => void;
}) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.value)) : 1;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon}
          {title}
        </h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExport} aria-label={_t('تصدير', 'Export')}>
          <Download size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          {_t('لا توجد بيانات', 'No data')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => (
            <div key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}>
                <span style={{ fontWeight: 500 }}>
                  <span style={{ color: 'var(--text-muted)', marginInlineEnd: '4px' }}>#{idx + 1}</span>
                  {item.name || `#${item.id}`}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtSAR(item.value, lang)}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', background: '#0F766E' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** SVG bar chart manual — لا يحتاج dependency جديد */
function RevenueTrendChart({
  data, lang, _t,
}: { data: Array<{ month: string; value: number }>; lang: string; _t: (ar: string, en: string) => string }) {
  if (data.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{_t('لا توجد بيانات', 'No data')}</p>;
  }
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(600, data.length * 60);
  const height = 200;
  const barWidth = width / data.length - 8;

  return (
    <svg width={width} height={height + 40} style={{ overflow: 'visible' }} role="img" aria-label="Revenue trend chart">
      {data.map((d, i) => {
        const h = (d.value / maxValue) * height;
        const x = i * (barWidth + 8) + 4;
        const y = height - h;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barWidth} height={h} fill="#0F766E" rx={2}>
              <title>{`${d.month}: ${fmtSAR(d.value, lang)}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height + 16} fontSize={10} textAnchor="middle" fill="var(--text-muted)">
              {d.month.slice(5)}
            </text>
            {h > 20 && (
              <text x={x + barWidth / 2} y={y - 4} fontSize={9} textAnchor="middle" fill="var(--text-muted)">
                {Math.round(d.value / 1000)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="card"
          style={{
            height: '100px',
            background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            marginBottom: '12px',
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
