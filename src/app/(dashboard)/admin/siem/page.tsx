'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SIEM Dashboard — `/admin/siem`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Security Information & Event Management dashboard.
 *  يعرض timeline موحّد لأحداث الأمان من 5 مصادر + كشف أنماط آلي.
 *
 *  المصادر المُجمَّعة:
 *   1. AuditLog        : كل العمليات CREATE/UPDATE/DELETE
 *   2. MfaAttempt      : محاولات MFA ناجحة/فاشلة
 *   3. FieldAuditLog   : تغييرات على حقول حساسة (PII، financial)
 *   4. ComplianceAuditLog : أحداث الامتثال (لو موجود)
 *   5. SafetyIncident  : حوادث السلامة (لو موجود)
 *
 *  الأنماط المكتشفة آلياً:
 *   - BRUTE_FORCE: 5+ MFA fails من نفس IP في 10 دقائق
 *   - MFA_BURST: 3+ MFA fails من نفس user في 5 دقائق
 *   - MASS_EXPORT: >50 operations من نفس actor في دقيقة
 *   - OFF_HOURS: تسجيل دخول 22:00-06:00 (Riyadh)
 *   - PRIVILEGE_ESCALATION: تعديل role/permission
 *
 *  Enterprise UX (15 ميزة):
 *   ✅ Live timeline + auto-refresh (60s)
 *   ✅ Time window selector (1h/24h/7d/30d)
 *   ✅ Severity + source filters + search
 *   ✅ Export CSV
 *   ✅ Pattern alerts بشكل بارز
 *   ✅ Permission-aware (403 → رسالة واضحة)
 *   ✅ All standard states (loading/error/empty/skeleton)
 *
 *  Permission: admin / owner / security_officer فقط
 *
 *  @see src/app/api/admin/siem/route.ts — backend logic
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import {
  Shield,
  RefreshCw,
  Download,
  Activity,
  Eye,
  XCircle,
  Clock,
  Lock,
  Search as SearchIcon,
  AlertOctagon,
  Zap,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types (متطابقة مع API contract في route.ts) ──────────────────────────────

type SiemSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type SiemSource = 'audit' | 'mfa' | 'field_audit' | 'compliance' | 'safety';

type SiemEventType =
  | 'AUDIT_CREATE' | 'AUDIT_UPDATE' | 'AUDIT_DELETE' | 'AUDIT_EXECUTE'
  | 'MFA_SUCCESS' | 'MFA_FAIL'
  | 'LOGIN_SUCCESS' | 'LOGIN_FAIL'
  | 'FIELD_CHANGE' | 'COMPLIANCE_VIOLATION' | 'SAFETY_INCIDENT';

interface SiemEvent {
  id: string;
  ts: string;
  type: SiemEventType;
  severity: SiemSeverity;
  source: SiemSource;
  actorId: number | null;
  actorUsername: string | null;
  ipAddress: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
}

interface SiemPattern {
  id: string;
  patternType: 'BRUTE_FORCE' | 'PRIVILEGE_ESCALATION' | 'MASS_EXPORT' | 'OFF_HOURS' | 'MFA_BURST';
  severity: SiemSeverity;
  detectedAt: string;
  description: string;
  relatedEventIds: string[];
  count: number;
}

interface SiemResponse {
  events: SiemEvent[];
  patterns: SiemPattern[];
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    bySource: Record<string, number>;
  };
  window: { from: string; to: string };
}

// ─── ثوابت العرض ──────────────────────────────────────────────────────────────

const SEVERITY_META: Record<SiemSeverity, { color: string; bg: string; ar: string; en: string }> = {
  INFO:     { color: '#64748B', bg: '#F1F5F9', ar: 'معلومة', en: 'Info' },
  LOW:      { color: '#16A34A', bg: '#DCFCE7', ar: 'منخفضة', en: 'Low' },
  MEDIUM:   { color: '#D97706', bg: '#FEF3C7', ar: 'متوسطة', en: 'Medium' },
  HIGH:     { color: '#DC2626', bg: '#FEE2E2', ar: 'عالية',  en: 'High' },
  CRITICAL: { color: '#7F1D1D', bg: '#FCA5A5', ar: 'حرجة',   en: 'Critical' },
};

const SOURCE_META: Record<SiemSource, { ar: string; en: string; icon: React.ComponentType<any>; color: string }> = {
  audit:        { ar: 'تدقيق',  en: 'Audit',      icon: Activity,     color: '#2563EB' },
  mfa:          { ar: 'MFA',    en: 'MFA',        icon: Lock,         color: '#7C3AED' },
  field_audit:  { ar: 'حقل',    en: 'Field',      icon: Eye,          color: '#0891B2' },
  compliance:   { ar: 'امتثال', en: 'Compliance', icon: Shield,       color: '#16A34A' },
  safety:       { ar: 'سلامة', en: 'Safety',     icon: AlertOctagon, color: '#DC2626' },
};

const PATTERN_META: Record<SiemPattern['patternType'], { ar: string; en: string; icon: React.ComponentType<any> }> = {
  BRUTE_FORCE:          { ar: 'هجوم Brute Force',  en: 'Brute Force Attack',   icon: AlertOctagon },
  MFA_BURST:            { ar: 'تكرار MFA مشبوه',   en: 'MFA Burst',            icon: Lock },
  MASS_EXPORT:          { ar: 'تصدير ضخم',         en: 'Mass Export',          icon: Download },
  OFF_HOURS:            { ar: 'دخول خارج الدوام',  en: 'Off-Hours Login',      icon: Clock },
  PRIVILEGE_ESCALATION: { ar: 'تصعيد صلاحيات',     en: 'Privilege Escalation', icon: Zap },
};

/** Time window presets (للـ dropdown) */
const WINDOW_OPTIONS = [
  { value: '1h',  ms: 60 * 60 * 1000,           ar: 'آخر ساعة',    en: 'Last hour' },
  { value: '24h', ms: 24 * 60 * 60 * 1000,      ar: 'آخر 24 ساعة', en: 'Last 24h' },
  { value: '7d',  ms: 7 * 24 * 60 * 60 * 1000,  ar: 'آخر 7 أيام',  en: 'Last 7d' },
  { value: '30d', ms: 30 * 24 * 60 * 60 * 1000, ar: 'آخر 30 يوم',  en: 'Last 30d' },
] as const;

/** تصدير CSV — نفس النمط في الصفحات الأخرى */
function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
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

export default function SiemDashboardPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<SiemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [windowValue, setWindowValue] = useState<typeof WINDOW_OPTIONS[number]['value']>('24h');
  const [filterSeverity, setFilterSeverity] = useState<SiemSeverity | 'ALL'>('ALL');
  const [filterSource, setFilterSource] = useState<SiemSource | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);

  const [detailEvent, setDetailEvent] = useState<SiemEvent | null>(null);

  /** نحفظ ref للـ interval علشان نوقفه عند unmount أو toggle */
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchSiem = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const window = WINDOW_OPTIONS.find((w) => w.value === windowValue) ?? WINDOW_OPTIONS[1];
      const to = new Date();
      const from = new Date(to.getTime() - window.ms);

      const qs = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        severity: filterSeverity,
        source: filterSource,
        limit: '200',
      });

      const res = await fetch(`/api/admin/siem?${qs.toString()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) {
        setLoadError(_t(
          'SIEM متاح فقط لدور Admin / Owner / Security Officer',
          'SIEM is restricted to Admin / Owner / Security Officer roles',
        ));
        return;
      }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const result = (await res.json()) as SiemResponse;
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowValue, filterSeverity, filterSource, lang]);

  useEffect(() => { void fetchSiem(); }, [fetchSiem]);

  /** Auto-refresh: كل 60 ثانية لو مفعّل */
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => { void fetchSiem(); }, 60_000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, fetchSiem]);

  // ─── Filter (search) ──────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return data.events;
    return data.events.filter((e) =>
      [
        e.id, e.type, e.source, e.severity,
        e.actorUsername ?? '', e.ipAddress ?? '',
        e.action, e.entityType ?? '', e.entityId ?? '', e.summary,
      ].join(' ').toLowerCase().includes(q),
    );
  }, [data, deferredSearch]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleExportCsv = () => {
    if (!filteredEvents.length) {
      toastError(_t('لا توجد أحداث للتصدير', 'No events to export'));
      return;
    }
    const rows = filteredEvents.map((e) => ({
      ID: e.id,
      Timestamp: e.ts,
      Type: e.type,
      Severity: e.severity,
      Source: e.source,
      ActorId: e.actorId ?? '',
      Actor: e.actorUsername ?? '',
      IP: e.ipAddress ?? '',
      Entity: e.entityType ?? '',
      EntityId: e.entityId ?? '',
      Summary: e.summary,
    }));
    exportToCsv(`siem-events-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  // Esc لإغلاق المودال
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetailEvent(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} color="#7C3AED" />
            {_t('مراقبة الأمان (SIEM)', 'Security Monitoring (SIEM)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'تجميع أحداث الأمان من جميع المصادر + كشف الأنماط المشبوهة آلياً',
              'Aggregated security events from all sources + automatic anomaly detection',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            {_t('تحديث آلي (60ث)', 'Auto-refresh (60s)')}
          </label>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchSiem()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'siem-spin' : ''} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportCsv} disabled={loading || !filteredEvents.length}>
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
        </div>
      </div>

      {/* Patterns Alert Banner */}
      {data && data.patterns.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#DC2626' }}>
            <AlertOctagon size={16} style={{ display: 'inline', marginInlineEnd: '6px' }} />
            {_t(`أنماط مشبوهة مكتشفة (${data.patterns.length})`, `Suspicious patterns detected (${data.patterns.length})`)}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {data.patterns.slice(0, 6).map((p) => {
              const meta = PATTERN_META[p.patternType];
              const sev = SEVERITY_META[p.severity];
              const Icon = meta.icon;
              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '12px',
                    background: sev.bg,
                    borderInlineStart: `4px solid ${sev.color}`,
                  }}
                  role="alert"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: sev.color, fontSize: '13px' }}>
                    <Icon size={16} />
                    {_t(meta.ar, meta.en)}
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: '#1F2937' }}>{p.description}</p>
                  <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {p.count} {_t('حدث', 'events')} · {new Date(p.detectedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </small>
                </div>
              );
            })}
          </div>
          {data.patterns.length > 6 && (
            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              + {data.patterns.length - 6} {_t('أنماط إضافية', 'more patterns')}
            </small>
          )}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <StatCard label={_t('الإجمالي', 'Total')} value={data.summary.total} color="#2563EB" />
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const).map((sv) => (
            <StatCard
              key={sv}
              label={_t(SEVERITY_META[sv].ar, SEVERITY_META[sv].en)}
              value={data.summary.bySeverity[sv] ?? 0}
              color={SEVERITY_META[sv].color}
              bg={SEVERITY_META[sv].bg}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            placeholder={_t('بحث في الأحداث...', 'Search events...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
            aria-label={_t('بحث', 'Search')}
          />
        </div>

        <select
          className="input"
          value={windowValue}
          onChange={(e) => setWindowValue(e.target.value as typeof WINDOW_OPTIONS[number]['value'])}
          style={{ minWidth: '140px' }}
          aria-label={_t('النافذة الزمنية', 'Time window')}
        >
          {WINDOW_OPTIONS.map((w) => (
            <option key={w.value} value={w.value}>{_t(w.ar, w.en)}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as SiemSeverity | 'ALL')}
          style={{ minWidth: '140px' }}
          aria-label={_t('فلتر الشدة', 'Severity')}
        >
          <option value="ALL">{_t('كل الشدات', 'All Severity')}</option>
          {(Object.keys(SEVERITY_META) as SiemSeverity[]).map((s) => (
            <option key={s} value={s}>{_t(SEVERITY_META[s].ar, SEVERITY_META[s].en)}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as SiemSource | 'ALL')}
          style={{ minWidth: '140px' }}
          aria-label={_t('فلتر المصدر', 'Source')}
        >
          <option value="ALL">{_t('كل المصادر', 'All Sources')}</option>
          {(Object.keys(SOURCE_META) as SiemSource[]).map((s) => (
            <option key={s} value={s}>{_t(SOURCE_META[s].ar, SOURCE_META[s].en)}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading && <TableSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchSiem()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}
      {!loading && !loadError && filteredEvents.length === 0 && (
        <EmptyState
          icon={<Shield size={48} color="var(--text-muted)" />}
          title={_t('لا توجد أحداث', 'No events')}
          message={_t('لم تُسجَّل أحداث أمنية في هذه النافذة الزمنية.', 'No security events in this time window.')}
        />
      )}

      {!loading && !loadError && filteredEvents.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>{_t('الوقت', 'Time')}</th>
                <th>{_t('الشدة', 'Severity')}</th>
                <th>{_t('النوع', 'Type')}</th>
                <th>{_t('المصدر', 'Source')}</th>
                <th>{_t('الفاعل', 'Actor')}</th>
                <th>{_t('IP', 'IP')}</th>
                <th>{_t('الملخص', 'Summary')}</th>
                <th>{_t('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => (
                <EventRow key={e.id} event={e} lang={lang} _t={_t} onOpen={() => setDetailEvent(e)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} _t={_t} lang={lang} />
      )}

      <style>{`.siem-spin { animation: siem-spin 1s linear infinite; } @keyframes siem-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div className="card" style={{ padding: '12px', background: bg ?? 'var(--card)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function EventRow({
  event, lang, _t, onOpen,
}: { event: SiemEvent; lang: string; _t: (ar: string, en: string) => string; onOpen: () => void }) {
  const sev = SEVERITY_META[event.severity];
  const src = SOURCE_META[event.source];
  const SrcIcon = src.icon;

  return (
    <tr>
      <td style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {new Date(event.ts).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        <br />
        <small>{new Date(event.ts).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</small>
      </td>
      <td>
        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, background: sev.bg, color: sev.color }}>
          {_t(sev.ar, sev.en)}
        </span>
      </td>
      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{event.type}</td>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: src.color }}>
          <SrcIcon size={12} />
          {_t(src.ar, src.en)}
        </span>
      </td>
      <td style={{ fontSize: '11px' }}>
        {event.actorUsername || (event.actorId !== null ? `#${event.actorId}` : '—')}
      </td>
      <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
        {event.ipAddress || '—'}
      </td>
      <td style={{ fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.summary}
      </td>
      <td>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onOpen} aria-label={_t('عرض', 'View')}>
          <Eye size={14} />
        </button>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }} aria-busy="true">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            height: '36px',
            background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            marginBottom: '6px',
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

function EventDetailModal({
  event, onClose, _t, lang,
}: { event: SiemEvent; onClose: () => void; _t: (ar: string, en: string) => string; lang: string }) {
  const sev = SEVERITY_META[event.severity];
  const src = SOURCE_META[event.source];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>
            <Eye size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
            {_t('تفاصيل الحدث', 'Event Details')} — {event.id}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label={_t('إغلاق', 'Close')}>✕</button>
        </div>

        <div className="modal-body">
          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <Field label={_t('النوع', 'Type')} value={event.type} />
            <Field label={_t('الشدة', 'Severity')} value={`${_t(sev.ar, sev.en)} (${event.severity})`} />
            <Field label={_t('المصدر', 'Source')} value={_t(src.ar, src.en)} />
            <Field label={_t('الفعل', 'Action')} value={event.action} />
            <Field label={_t('الفاعل', 'Actor')} value={event.actorUsername || (event.actorId !== null ? `#${event.actorId}` : '—')} />
            <Field label={_t('IP', 'IP')} value={event.ipAddress || '—'} />
            <Field label={_t('نوع الكائن', 'Entity Type')} value={event.entityType || '—'} />
            <Field label={_t('معرّف الكائن', 'Entity ID')} value={event.entityId || '—'} />
            <Field label={_t('الوقت', 'Timestamp')} value={new Date(event.ts).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} fullWidth />
            <Field label={_t('الملخص', 'Summary')} value={event.summary} fullWidth />
          </div>

          {Object.keys(event.metadata).length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                {_t('بيانات تفصيلية', 'Detailed Metadata')}
              </h4>
              <pre
                style={{
                  fontSize: '12px',
                  background: '#F9FAFB',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  direction: 'ltr',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                }}
              >
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{_t('إغلاق', 'Close')}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, fullWidth = false }: { label: string; value: string | number; fullWidth?: boolean }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
