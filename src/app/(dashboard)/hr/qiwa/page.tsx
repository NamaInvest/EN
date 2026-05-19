'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Qiwa Dashboard — `/hr/qiwa`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  قوى = منصة وزارة الموارد البشرية لتوثيق العقود + تتبع القوى العاملة.
 *  هذه الصفحة هي لوحة قيادة (overview).
 *  للإدارة التفصيلية للعقود → /hr/qiwa/contracts
 *
 *  الميزات:
 *   1. ملخص العقود: ACTIVE / EXPIRED / TERMINATED / PENDING
 *   2. تنبيه العقود المنتهية الصلاحية خلال 30 يوم
 *   3. تنبيه الموظفين بلا عقود مسجلة
 *   4. آخر مزامنة مع قوى
 *   5. زر مزامنة manual (يستدعي /api/saudi/qiwa/sync)
 *
 *  المرجع القانوني: قرار وزير الموارد البشرية رقم 121130/1441
 *
 *  Permission: admin / owner / hr_officer / compliance_officer
 *
 *  @see src/app/api/hr/qiwa/route.ts (dashboard data)
 *  @see src/app/api/saudi/qiwa/sync/route.ts (sync action)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Calendar,
  RefreshCcw,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QiwaDashboard {
  summary: {
    totalContracts: number;
    active: number;
    expired: number;
    terminated: number;
    pending: number;
    expiringSoonCount: number;
  };
  employees: {
    total: number;
    withActiveContract: number;
    withoutContract: number;
  };
  expiringSoon: Array<{
    contractId: number;
    contractNo: string;
    contractType: string;
    endDate: string | null;
    employeeId: number;
    employeeName: string | null;
    daysRemaining: number | null;
  }>;
  lastSyncAt: string | null;
  alerts: Array<{ type: string; message: string; action?: string; legalRef?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function QiwaPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  const [data, setData] = useState<QiwaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/hr/qiwa', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as QiwaDashboard;
      setData(result);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, `Load failed`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  const handleSync = async () => {
    if (!confirm(_t(
      'سيتم محاولة المزامنة مع بوابة قوى الرسمية. متابعة؟',
      'Will attempt to sync with official Qiwa portal. Continue?',
    ))) return;

    setSyncing(true);
    try {
      const res = await fetch('/api/saudi/qiwa/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityCode: 'DEFAULT' }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      toastSuccess(_t('تمت المزامنة', 'Synced'));
      await fetchDashboard();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={28} color="#0F766E" />
            {_t('قوى — توثيق العقود', 'Qiwa — Contract Registration')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'منصة وزارة الموارد البشرية لتوثيق عقود العمل — قرار 121130/1441',
              'Saudi MoHRSD platform for contract registration — Decision 121130/1441',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="https://www.qiwa.sa/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <ExternalLink size={16} /> {_t('بوابة قوى', 'Qiwa Portal')}
          </a>
          <a href="/hr/qiwa/contracts" className="btn btn-ghost">
            <FileText size={16} /> {_t('إدارة العقود', 'Manage Contracts')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchDashboard()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'qi-spin' : ''} />
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            <RefreshCcw size={18} className={syncing ? 'qi-spin' : ''} /> {syncing ? _t('جاري المزامنة...', 'Syncing...') : _t('مزامنة قوى', 'Sync Qiwa')}
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
          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {data.alerts.map((a, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '12px 16px',
                    background: a.type === 'WARNING' ? '#FEE2E2' : '#DBEAFE',
                    borderInlineStart: `4px solid ${a.type === 'WARNING' ? '#DC2626' : '#2563EB'}`,
                    marginBottom: '8px',
                  }}
                  role="alert"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: a.type === 'WARNING' ? '#7F1D1D' : '#1E40AF' }}>
                    <AlertTriangle size={18} />
                    <strong>{a.message}</strong>
                  </div>
                  {a.action && (
                    <p style={{ fontSize: '12px', marginTop: '4px', marginInlineStart: '26px', color: 'var(--text-muted)' }}>
                      → {a.action}
                    </p>
                  )}
                  {a.legalRef && (
                    <p style={{ fontSize: '11px', marginTop: '2px', marginInlineStart: '26px', color: 'var(--text-muted)' }}>
                      {a.legalRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {_t('ملخص العقود', 'Contracts Summary')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <StatCard icon={<FileText size={20} color="#2563EB" />} label={_t('إجمالي العقود', 'Total')} value={String(data.summary.totalContracts)} bg="#EFF6FF" />
            <StatCard icon={<CheckCircle2 size={20} color="#16A34A" />} label={_t('نشطة', 'Active')} value={String(data.summary.active)} bg="#DCFCE7" />
            <StatCard icon={<Clock size={20} color="#D97706" />} label={_t('معلّقة', 'Pending')} value={String(data.summary.pending)} bg="#FEF3C7" />
            <StatCard icon={<XCircle size={20} color="#DC2626" />} label={_t('منتهية', 'Expired')} value={String(data.summary.expired)} bg="#FEE2E2" />
            <StatCard icon={<XCircle size={20} color="#64748B" />} label={_t('مُنهَاة', 'Terminated')} value={String(data.summary.terminated)} bg="#F1F5F9" />
          </div>

          {/* Employees Coverage */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {_t('تغطية الموظفين', 'Employees Coverage')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <StatCard icon={<Users size={20} color="#2563EB" />} label={_t('إجمالي الموظفين', 'Total Employees')} value={String(data.employees.total)} bg="#EFF6FF" />
            <StatCard icon={<CheckCircle2 size={20} color="#16A34A" />} label={_t('بعقد نشط', 'With Active Contract')} value={String(data.employees.withActiveContract)} bg="#DCFCE7" />
            <StatCard icon={<AlertTriangle size={20} color="#DC2626" />} label={_t('بلا عقد', 'Without Contract')} value={String(data.employees.withoutContract)} bg="#FEE2E2" />
          </div>

          {/* Last sync */}
          {data.lastSyncAt && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <Clock size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
              {_t('آخر مزامنة:', 'Last sync:')} {new Date(data.lastSyncAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          )}

          {/* Expiring Soon Table */}
          <div className="card" style={{ overflow: 'auto', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#D97706" />
                {_t(`عقود تنتهي خلال 30 يوم (${data.summary.expiringSoonCount})`, `Expiring in 30 days (${data.summary.expiringSoonCount})`)}
              </h3>
            </div>

            {data.expiringSoon.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#16A34A' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 600 }}>{_t('لا توجد عقود قريبة الانتهاء', 'No contracts expiring soon')}</p>
              </div>
            ) : (
              <table className="table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{_t('رقم العقد', 'Contract No')}</th>
                    <th>{_t('الموظف', 'Employee')}</th>
                    <th>{_t('النوع', 'Type')}</th>
                    <th>{_t('ينتهي', 'Ends')}</th>
                    <th>{_t('متبقي', 'Days Left')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiringSoon.map((c) => (
                    <tr key={c.contractId} style={c.daysRemaining !== null && c.daysRemaining <= 7 ? { background: '#FEF2F220' } : undefined}>
                      <td style={{ fontWeight: 600 }}>#{c.contractId}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.contractNo}</td>
                      <td>{c.employeeName || `#${c.employeeId}`}</td>
                      <td style={{ fontSize: '12px' }}>{c.contractType}</td>
                      <td style={{ fontSize: '12px' }}>
                        {c.endDate ? new Date(c.endDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td>
                        {c.daysRemaining !== null ? (
                          <span style={{
                            color: c.daysRemaining <= 7 ? '#DC2626' : c.daysRemaining <= 14 ? '#D97706' : '#64748B',
                            fontWeight: 600,
                            fontSize: '13px',
                          }}>
                            {c.daysRemaining} {_t('يوم', 'days')}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <style>{`.qi-spin { animation: qi-spin 1s linear infinite; } @keyframes qi-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: bg }}>
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
