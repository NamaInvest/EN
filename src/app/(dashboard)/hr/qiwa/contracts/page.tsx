'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Qiwa Contracts Manager — `/hr/qiwa/contracts`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة عقود قوى الكاملة: قائمة + إنشاء + فلاتر.
 *  للملخص الأعم → /hr/qiwa
 *
 *  أنواع العقود حسب نظام قوى:
 *   - UNLIMITED  : غير محدد المدة (الافتراضي للوظائف الدائمة)
 *   - FIXED      : محدد المدة (Project-based)
 *   - PART_TIME  : دوام جزئي
 *   - SEASONAL   : موسمي (مثل التمور/الحج)
 *   - FLEXIBLE   : عقد مرن
 *
 *  الحالات:
 *   - ACTIVE / EXPIRED / TERMINATED / PENDING
 *
 *  Enterprise UX:
 *   ✅ Filters (status/contractType)
 *   ✅ Search (employee name/contractNo)
 *   ✅ Pagination
 *   ✅ Export CSV
 *   ✅ Create modal مع validation كاملة
 *   ✅ كل standard states
 *
 *  Permission: admin / owner / hr_officer
 *
 *  @see src/app/api/hr/qiwa/contracts/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
  Briefcase,
  Plus,
  RefreshCw,
  Download,
  Search as SearchIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractType = 'UNLIMITED' | 'FIXED' | 'PART_TIME' | 'SEASONAL' | 'FLEXIBLE';
type QiwaStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';

interface QiwaContract {
  id: number;
  employeeId: number;
  contractNo: string;
  contractType: ContractType;
  qiwaStatus: QiwaStatus;
  startDate: string;
  endDate: string | null;
  position: string | null;
  wageAmount: number | string | null;
  wageCurrency: string;
  syncedAt: string | null;
  createdAt: string;
  employee?: { id: number; name: string };
}

interface ListResponse {
  items: QiwaContract[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface CreateForm {
  employeeId: string;
  contractNo: string;
  contractType: ContractType;
  qiwaStatus: QiwaStatus;
  startDate: string;
  endDate: string;
  position: string;
  wageAmount: string;
}

const TYPE_META: Record<ContractType, { ar: string; en: string }> = {
  UNLIMITED: { ar: 'غير محدد المدة', en: 'Unlimited' },
  FIXED:     { ar: 'محدد المدة',    en: 'Fixed' },
  PART_TIME: { ar: 'دوام جزئي',     en: 'Part-time' },
  SEASONAL:  { ar: 'موسمي',         en: 'Seasonal' },
  FLEXIBLE:  { ar: 'مرن',           en: 'Flexible' },
};

const STATUS_META: Record<QiwaStatus, { color: string; bg: string; ar: string; en: string }> = {
  ACTIVE:     { color: '#16A34A', bg: '#DCFCE7', ar: 'نشط',    en: 'Active' },
  PENDING:    { color: '#D97706', bg: '#FEF3C7', ar: 'معلّق',   en: 'Pending' },
  EXPIRED:    { color: '#DC2626', bg: '#FEE2E2', ar: 'منتهي',  en: 'Expired' },
  TERMINATED: { color: '#64748B', bg: '#F1F5F9', ar: 'مُنهَى',  en: 'Terminated' },
};

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(n);
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
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

export default function QiwaContractsPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<QiwaContract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<QiwaStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ContractType | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    employeeId: '',
    contractNo: '',
    contractType: 'UNLIMITED',
    qiwaStatus: 'ACTIVE',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    position: '',
    wageAmount: '',
  });

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchContracts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filterStatus !== 'ALL') qs.set('status', filterStatus);
      if (filterType) qs.set('contractType', filterType);

      const res = await fetch(`/api/hr/qiwa/contracts?${qs.toString()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ListResponse;
      setItems(data.items);
      setTotal(data.total);
      setPageCount(data.pageCount);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterStatus, filterType, lang]);

  useEffect(() => { void fetchContracts(); }, [fetchContracts]);

  const filteredItems = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [
        String(c.id),
        c.contractNo,
        c.contractType,
        c.qiwaStatus,
        c.position ?? '',
        c.employee?.name ?? String(c.employeeId),
      ].join(' ').toLowerCase().includes(q),
    );
  }, [items, deferredSearch]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const resetFilters = () => { setFilterStatus('ALL'); setFilterType(''); setSearchInput(''); setPage(1); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        employeeId: Number(createForm.employeeId),
        contractNo: createForm.contractNo.trim(),
        contractType: createForm.contractType,
        qiwaStatus: createForm.qiwaStatus,
        startDate: createForm.startDate,
        endDate: createForm.endDate || null,
        position: createForm.position || null,
        wageAmount: createForm.wageAmount ? Number(createForm.wageAmount) : null,
      };
      if (!payload.employeeId) { toastError(_t('معرّف الموظف مطلوب', 'Employee ID required')); return; }
      if (!payload.contractNo) { toastError(_t('رقم العقد مطلوب', 'Contract No required')); return; }

      const res = await fetch('/api/hr/qiwa/contracts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (res.status === 409) { toastError(_t('رقم العقد مستخدم', 'Contract No already used')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم إنشاء العقد', 'Contract created'));
      setShowCreate(false);
      setCreateForm({
        employeeId: '',
        contractNo: '',
        contractType: 'UNLIMITED',
        qiwaStatus: 'ACTIVE',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        position: '',
        wageAmount: '',
      });
      await fetchContracts();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    if (!filteredItems.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = filteredItems.map((c) => ({
      ID: c.id,
      ContractNo: c.contractNo,
      EmployeeID: c.employeeId,
      EmployeeName: c.employee?.name ?? '',
      ContractType: c.contractType,
      Status: c.qiwaStatus,
      StartDate: c.startDate,
      EndDate: c.endDate ?? '',
      Position: c.position ?? '',
      WageAmount: toNum(c.wageAmount),
      WageCurrency: c.wageCurrency,
    }));
    exportToCsv(`qiwa-contracts-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreate(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={28} color="#0F766E" />
            {_t('عقود قوى', 'Qiwa Contracts')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t('إدارة عقود الموظفين الموثقة في منصة قوى', 'Manage employee contracts registered in Qiwa')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/hr/qiwa" className="btn btn-ghost">
            <Users size={16} /> {_t('لوحة قوى', 'Qiwa Dashboard')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchContracts()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'qc-spin' : ''} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={loading || !filteredItems.length}>
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> {_t('عقد جديد', 'New Contract')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }} role="search">
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
            placeholder={_t('ابحث برقم/موظف/منصب...', 'Search by no/employee/position...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
            aria-label={_t('بحث', 'Search')}
          />
        </div>

        <select
          className="input"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as QiwaStatus | 'ALL'); setPage(1); }}
          style={{ minWidth: '150px' }}
        >
          <option value="ALL">{_t('كل الحالات', 'All Statuses')}</option>
          {(Object.keys(STATUS_META) as QiwaStatus[]).map((s) => (
            <option key={s} value={s}>{_t(STATUS_META[s].ar, STATUS_META[s].en)}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as ContractType | ''); setPage(1); }}
          style={{ minWidth: '170px' }}
        >
          <option value="">{_t('كل الأنواع', 'All Types')}</option>
          {(Object.keys(TYPE_META) as ContractType[]).map((t) => (
            <option key={t} value={t}>{_t(TYPE_META[t].ar, TYPE_META[t].en)}</option>
          ))}
        </select>

        <button type="button" className="btn btn-ghost" onClick={resetFilters}>{_t('تصفير', 'Reset')}</button>
      </div>

      {/* Content */}
      {loading && <TableSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchContracts()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}
      {!loading && !loadError && filteredItems.length === 0 && (
        <EmptyState
          icon={<Briefcase size={48} color="var(--text-muted)" />}
          title={_t('لا توجد عقود', 'No contracts')}
          message={_t('لم تُسجَّل أي عقود بعد.', 'No contracts registered yet.')}
          actionLabel={_t('عقد جديد', 'New Contract')}
          onAction={() => setShowCreate(true)}
        />
      )}

      {!loading && !loadError && filteredItems.length > 0 && (
        <>
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{_t('رقم العقد', 'Contract No')}</th>
                  <th>{_t('الموظف', 'Employee')}</th>
                  <th>{_t('النوع', 'Type')}</th>
                  <th>{_t('الحالة', 'Status')}</th>
                  <th>{_t('البداية', 'Start')}</th>
                  <th>{_t('النهاية', 'End')}</th>
                  <th>{_t('المنصب', 'Position')}</th>
                  <th>{_t('الراتب', 'Wage')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((c) => {
                  const statMeta = STATUS_META[c.qiwaStatus];
                  const typeMeta = TYPE_META[c.contractType];
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>#{c.id}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.contractNo}</td>
                      <td>{c.employee?.name || `#${c.employeeId}`}</td>
                      <td style={{ fontSize: '12px' }}>{_t(typeMeta.ar, typeMeta.en)}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: statMeta.bg,
                          color: statMeta.color,
                        }}>
                          {_t(statMeta.ar, statMeta.en)}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(c.startDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {c.endDate ? new Date(c.endDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td style={{ fontSize: '12px' }}>{c.position || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {c.wageAmount ? fmtSAR(toNum(c.wageAmount), lang) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {_t(`صفحة ${page} من ${pageCount} (إجمالي ${total})`, `Page ${page} of ${pageCount} (total ${total})`)}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-ghost" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {_t('← السابقة', '← Previous')}
              </button>
              <button type="button" className="btn btn-ghost" disabled={page >= pageCount || loading} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                {_t('التالية →', 'Next →')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>
                <Briefcase size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('عقد جديد', 'New Contract')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-emp">{_t('معرّف الموظف', 'Employee ID')} *</label>
                    <input
                      id="qc-emp"
                      type="number"
                      min={1}
                      className="input"
                      required
                      value={createForm.employeeId}
                      onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-no">{_t('رقم العقد', 'Contract No')} *</label>
                    <input
                      id="qc-no"
                      className="input"
                      required
                      maxLength={120}
                      value={createForm.contractNo}
                      onChange={(e) => setCreateForm({ ...createForm, contractNo: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-type">{_t('نوع العقد', 'Contract Type')} *</label>
                    <select
                      id="qc-type"
                      className="input"
                      required
                      value={createForm.contractType}
                      onChange={(e) => setCreateForm({ ...createForm, contractType: e.target.value as ContractType })}
                    >
                      {(Object.keys(TYPE_META) as ContractType[]).map((t) => (
                        <option key={t} value={t}>{_t(TYPE_META[t].ar, TYPE_META[t].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-status">{_t('الحالة', 'Status')}</label>
                    <select
                      id="qc-status"
                      className="input"
                      value={createForm.qiwaStatus}
                      onChange={(e) => setCreateForm({ ...createForm, qiwaStatus: e.target.value as QiwaStatus })}
                    >
                      {(Object.keys(STATUS_META) as QiwaStatus[]).map((s) => (
                        <option key={s} value={s}>{_t(STATUS_META[s].ar, STATUS_META[s].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-start">
                      <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                      {_t('تاريخ البداية', 'Start Date')} *
                    </label>
                    <input
                      id="qc-start"
                      type="date"
                      className="input"
                      required
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-end">
                      <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                      {_t('تاريخ النهاية', 'End Date')}
                    </label>
                    <input
                      id="qc-end"
                      type="date"
                      className="input"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-pos">{_t('المنصب', 'Position')}</label>
                    <input
                      id="qc-pos"
                      className="input"
                      maxLength={120}
                      value={createForm.position}
                      onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="qc-wage">{_t('الراتب (SAR)', 'Wage (SAR)')}</label>
                    <input
                      id="qc-wage"
                      type="number"
                      min={0}
                      step="0.01"
                      className="input"
                      value={createForm.wageAmount}
                      onChange={(e) => setCreateForm({ ...createForm, wageAmount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>
                  {_t('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? _t('جاري الحفظ...', 'Saving...') : _t('حفظ', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.qc-spin { animation: qc-spin 1s linear infinite; } @keyframes qc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function EmptyState({
  icon, title, message, actionLabel, onAction,
}: { icon: React.ReactNode; title: string; message: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onAction}>
        <Plus size={16} style={{ marginInlineEnd: '6px' }} /> {actionLabel}
      </button>
    </div>
  );
}
