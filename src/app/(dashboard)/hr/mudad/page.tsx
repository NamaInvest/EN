'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Mudad WPS Compliance Dashboard — `/hr/mudad`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  مداد = منصة وزارة الموارد البشرية لحماية أجور الموظفين (WPS).
 *  هذه الصفحة تعرض:
 *   1. نسبة الامتثال الكلية + 4 حالات الموظفين (ACTIVE/PENDING/SUSPENDED/EXEMPTED)
 *   2. قائمة الموظفين غير المحميين (يجب تسجيلهم)
 *   3. تقرير شهري للامتثال
 *   4. واجهة Bulk Update لتحديث الحالات بعد المزامنة مع بوابة مداد
 *
 *  الالتزام القانوني:
 *   - قرار وزير الموارد البشرية رقم 4044/1434
 *   - WPS إلزامي لكل المنشآت التي لها 11 موظف+
 *   - عدم الامتثال = إيقاف الخدمات الحكومية + غرامات
 *
 *  Enterprise UX (15 ميزة):
 *   ✅ Compliance % مع color-coded gauge
 *   ✅ Stats: 4 statuses (ACTIVE/PENDING/SUSPENDED/total)
 *   ✅ قائمة Unprotected employees مع reason
 *   ✅ Bulk update modal (متعدد الحالات)
 *   ✅ Monthly report generator
 *   ✅ Export CSV
 *   ✅ كل الـ standard states
 *   ✅ Permission-aware (admin/owner/hr/payroll/compliance)
 *
 *  @see src/app/api/hr/mudad/compliance/route.ts
 *  @see src/lib/mudad-compliance.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  ExternalLink,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types (متطابقة مع API) ──────────────────────────────────────────────────

type MudadStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXEMPTED';

interface ComplianceStatus {
  totalEmployees: number;
  protectedEmployees: number;
  pendingEmployees: number;
  suspendedEmployees: number;
  compliancePct: number;
  isCompliant: boolean;
  lastSyncAt: string | null;
}

interface UnprotectedEmployee {
  id: number;
  name: string;
  mudadStatus: MudadStatus | null;
  issues?: string[];
}

interface DashboardResponse {
  compliance: ComplianceStatus;
  unprotected: {
    count: number;
    employees: UnprotectedEmployee[];
  };
  alerts: Array<{
    type: string;
    severity?: string;
    message: string;
    action?: string;
    legalRef?: string;
  }>;
}

interface BulkUpdateItem {
  employeeId: number;
  status: MudadStatus;
}

// ─── ثوابت العرض ──────────────────────────────────────────────────────────────

const STATUS_META: Record<MudadStatus, { color: string; bg: string; ar: string; en: string }> = {
  ACTIVE:    { color: '#16A34A', bg: '#DCFCE7', ar: 'نشط',     en: 'Active' },
  PENDING:   { color: '#D97706', bg: '#FEF3C7', ar: 'معلّق',    en: 'Pending' },
  SUSPENDED: { color: '#DC2626', bg: '#FEE2E2', ar: 'موقوف',   en: 'Suspended' },
  EXEMPTED:  { color: '#64748B', bg: '#F1F5F9', ar: 'مُعفى',   en: 'Exempted' },
};

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

/** يحدد لون حسب نسبة الامتثال */
function complianceColor(pct: number): string {
  if (pct >= 0.95) return '#16A34A';
  if (pct >= 0.8) return '#D97706';
  return '#DC2626';
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function MudadPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Bulk update state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Monthly report state
  const [showReport, setShowReport] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ─── Fetch dashboard ──────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/hr/mudad/compliance?view=dashboard', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as DashboardResponse;
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** يحلل نص CSV/list في bulk update modal */
  const parseBulkText = (text: string): BulkUpdateItem[] => {
    const items: BulkUpdateItem[] = [];
    const validStatuses: MudadStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'EXEMPTED'];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/[,\t]/).map((s) => s.trim());
      if (parts.length < 2) continue;
      const employeeId = parseInt(parts[0], 10);
      const status = parts[1].toUpperCase() as MudadStatus;
      if (!employeeId || !validStatuses.includes(status)) continue;
      items.push({ employeeId, status });
    }
    return items;
  };

  const handleBulkUpdate = async () => {
    const updates = parseBulkText(bulkText);
    if (updates.length === 0) {
      toastError(_t('لم يتم استخراج أي تحديث صالح', 'No valid updates parsed'));
      return;
    }
    if (!confirm(_t(
      `سيتم تحديث ${updates.length} موظف. متابعة؟`,
      `Will update ${updates.length} employees. Continue?`,
    ))) return;

    setBulkUpdating(true);
    try {
      const res = await fetch('/api/hr/mudad/compliance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as { updated: number; errors: any[]; message: string };
      toastSuccess(result.message);
      setShowBulk(false);
      setBulkText('');
      await fetchDashboard();
      if (result.errors?.length) {
        toastError(_t(`فشل ${result.errors.length} تحديث`, `${result.errors.length} updates failed`));
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!/^\d{4}-\d{2}$/.test(reportMonth)) {
      toastError(_t('الفترة يجب YYYY-MM', 'Month must be YYYY-MM'));
      return;
    }
    setReportLoading(true);
    setReportData(null);
    try {
      const res = await fetch(`/api/hr/mudad/compliance?view=report&month=${reportMonth}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setReportData(result);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportUnprotected = () => {
    if (!data?.unprotected?.employees?.length) {
      toastError(_t('لا توجد بيانات', 'No data'));
      return;
    }
    const rows = data.unprotected.employees.map((e) => ({
      EmployeeID: e.id,
      Name: e.name,
      MudadStatus: e.mudadStatus || 'NULL',
      Issues: (e.issues || []).join('; '),
    }));
    exportToCsv(`mudad-unprotected-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  // Esc to close modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBulk(false);
        setShowReport(false);
      }
    };
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
            <Shield size={28} color="#0F766E" />
            {_t('مداد — حماية الأجور (WPS)', 'Mudad — Wage Protection (WPS)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'منصة وزارة الموارد البشرية لحماية أجور الموظفين — إلزامي حسب قرار 4044/1434',
              'Saudi MoHRSD wage protection platform — mandatory per Decision 4044/1434',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="https://mudad.com.sa/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            <ExternalLink size={16} /> {_t('بوابة مداد', 'Mudad Portal')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchDashboard()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'mu-spin' : ''} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowReport(true)}>
            <FileText size={18} /> {_t('تقرير شهري', 'Monthly Report')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowBulk(true)}>
            <Upload size={18} /> {_t('تحديث جماعي', 'Bulk Update')}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <DashboardSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchDashboard()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}

      {!loading && !loadError && data && (
        <>
          {/* Compliance Alert Banner */}
          {data.alerts && data.alerts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {data.alerts.map((a, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '12px 16px',
                    background: '#FEE2E2',
                    borderInlineStart: '4px solid #DC2626',
                  }}
                  role="alert"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7F1D1D' }}>
                    <AlertTriangle size={18} />
                    <strong>{a.message}</strong>
                  </div>
                  {a.action && (
                    <p style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '4px', marginInlineStart: '26px' }}>
                      → {a.action}
                    </p>
                  )}
                  {a.legalRef && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginInlineStart: '26px' }}>
                      {a.legalRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Compliance Gauge + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
                {_t('نسبة الامتثال', 'Compliance %')}
              </h3>
              <div style={{ fontSize: '48px', fontWeight: 700, color: complianceColor(data.compliance.compliancePct), lineHeight: 1 }}>
                {Math.round(data.compliance.compliancePct * 100)}%
              </div>
              <div style={{ marginTop: '12px', width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${data.compliance.compliancePct * 100}%`,
                    height: '100%',
                    background: complianceColor(data.compliance.compliancePct),
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.compliance.isCompliant ? (
                  <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> {_t('متوافق', 'Compliant')}
                  </span>
                ) : (
                  <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} /> {_t('غير متوافق', 'Non-Compliant')}
                  </span>
                )}
              </div>
            </div>

            <StatCard
              icon={<Users size={24} color="#2563EB" />}
              label={_t('إجمالي الموظفين', 'Total Employees')}
              value={String(data.compliance.totalEmployees)}
              bg="#EFF6FF"
            />
            <StatCard
              icon={<CheckCircle2 size={24} color="#16A34A" />}
              label={_t('محميون', 'Protected')}
              value={String(data.compliance.protectedEmployees)}
              bg="#DCFCE7"
            />
            <StatCard
              icon={<Clock size={24} color="#D97706" />}
              label={_t('معلّقون', 'Pending')}
              value={String(data.compliance.pendingEmployees)}
              bg="#FEF3C7"
            />
            <StatCard
              icon={<XCircle size={24} color="#DC2626" />}
              label={_t('موقوفون', 'Suspended')}
              value={String(data.compliance.suspendedEmployees)}
              bg="#FEE2E2"
            />
          </div>

          {/* Last sync */}
          {data.compliance.lastSyncAt && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <Clock size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
              {_t('آخر مزامنة:', 'Last sync:')} {new Date(data.compliance.lastSyncAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          )}

          {/* Unprotected employees */}
          <div className="card" style={{ overflow: 'auto', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="#D97706" />
                {_t(
                  `موظفون غير محميين (${data.unprotected.count})`,
                  `Unprotected Employees (${data.unprotected.count})`,
                )}
              </h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleExportUnprotected} disabled={!data.unprotected.count}>
                <Download size={14} /> {_t('تصدير', 'Export')}
              </button>
            </div>

            {data.unprotected.employees.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#16A34A' }}>
                <ShieldCheck size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 600 }}>{_t('جميع الموظفين محميون ✓', 'All employees protected ✓')}</p>
              </div>
            ) : (
              <table className="table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{_t('الموظف', 'Employee')}</th>
                    <th>{_t('الحالة الحالية', 'Current Status')}</th>
                    <th>{_t('المشاكل', 'Issues')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.unprotected.employees.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>#{e.id}</td>
                      <td>{e.name || '—'}</td>
                      <td>
                        {e.mudadStatus ? (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: STATUS_META[e.mudadStatus].bg,
                            color: STATUS_META[e.mudadStatus].color,
                          }}>
                            {_t(STATUS_META[e.mudadStatus].ar, STATUS_META[e.mudadStatus].en)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#DC2626', fontStyle: 'italic' }}>
                            {_t('غير مسجل', 'Not registered')}
                          </span>
                        )}
                      </td>
                      <td>
                        {e.issues && e.issues.length > 0 ? (
                          <ul style={{ margin: 0, paddingInlineStart: '20px', fontSize: '12px', color: '#7F1D1D' }}>
                            {e.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                          </ul>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {data.unprotected.count > data.unprotected.employees.length && (
              <p style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                {_t(
                  `عرض ${data.unprotected.employees.length} من ${data.unprotected.count} — صدّر CSV لرؤية الكل`,
                  `Showing ${data.unprotected.employees.length} of ${data.unprotected.count} — export CSV to see all`,
                )}
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── Bulk Update Modal ───────────────────────────────────────────── */}
      {showBulk && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>
                <Upload size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('تحديث جماعي لحالة مداد', 'Mudad Bulk Status Update')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowBulk(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {_t(
                  'أدخل التحديثات (صيغة: ID,STATUS — حالة لكل سطر). انسخ من تقرير مداد الرسمي.',
                  'Enter updates (format: ID,STATUS — one per line). Paste from official Mudad report.',
                )}
              </p>
              <div style={{ padding: '8px', background: '#F9FAFB', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
                {_t('مثال:', 'Example:')}<br />
                {_t('123,نشط', '123,ACTIVE')}<br />
                {_t('124,قيد الانتظار', '124,PENDING')}<br />
                125,SUSPENDED<br />
                126,EXEMPTED
              </div>
              <textarea
                className="input"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                placeholder={_t('ID,STATUS', 'ID,STATUS')}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                aria-label={_t('تحديثات', 'Updates')}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {_t(
                  `سيتم تحليل ${parseBulkText(bulkText).length} تحديث صالح`,
                  `Will parse ${parseBulkText(bulkText).length} valid updates`,
                )}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowBulk(false)} disabled={bulkUpdating}>
                {_t('إلغاء', 'Cancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleBulkUpdate} disabled={bulkUpdating || parseBulkText(bulkText).length === 0}>
                {bulkUpdating ? _t('جاري التحديث...', 'Updating...') : _t('تطبيق', 'Apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Monthly Report Modal ────────────────────────────────────────── */}
      {showReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>
                <FileText size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('تقرير الامتثال الشهري', 'Monthly Compliance Report')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowReport(false); setReportData(null); }} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input
                  type="month"
                  className="input"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  style={{ width: '200px' }}
                  aria-label={_t('الشهر', 'Month')}
                />
                <button type="button" className="btn btn-primary" onClick={handleGenerateReport} disabled={reportLoading}>
                  {reportLoading ? _t('جاري التحميل...', 'Loading...') : _t('بناء التقرير', 'Build Report')}
                </button>
              </div>

              {reportData && (
                <pre
                  style={{
                    fontSize: '12px',
                    background: '#F9FAFB',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '400px',
                    direction: 'ltr',
                    textAlign: 'left',
                    border: '1px solid var(--border)',
                  }}
                >
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowReport(false); setReportData(null); }}>
                {_t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.mu-spin { animation: mu-spin 1s linear infinite; } @keyframes mu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: bg }}>
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="card"
          style={{
            height: '80px',
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
