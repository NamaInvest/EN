'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL Data Subject Requests Dashboard — `/compliance/pdpl/dsr`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  واجهة إدارة طلبات أصحاب البيانات (PDPL Art 12).
 *  - يستجيب لطلبات الوصول / الحذف / التصحيح / التقييد / النقل
 *  - مهلة قانونية: 30 يوم من تاريخ الاستلام
 *  - تتبع الطلبات المتأخرة (overdue) بشكل بارز لتجنب الغرامات
 *
 *  Workflow:
 *   1. صاحب البيانات يقدم طلب → POST /api/pdpl/dsr
 *   2. الـ DPO يفتح الطلب → يضع IN_PROGRESS
 *   3. تنفيذ آلي (ACCESS/ERASE/PORTABILITY) → POST /api/pdpl/dsr/[id]/fulfill
 *   4. أو رفض مع سبب → PATCH /api/pdpl/dsr/[id] { status: REJECTED, reason }
 *
 *  Enterprise UX (15 ميزة من AI_EXECUTION_STANDARD v2.0):
 *   ✅ Filters (status, requestType, subjectType, search)
 *   ✅ Search debounced
 *   ✅ Pagination + Export CSV + Sort + Responsive
 *   ✅ Keyboard nav + Retry + Permission-aware
 *   ✅ Status badges + Empty/Error/Skeleton states
 *   ✅ Overdue alerts (PDPL Art 12 — 30 days deadline)
 *   ✅ PII masking في القوائم (الـ identifier يظهر مقصوصاً)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import {
  UserCog,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Search as SearchIcon,
  FileText,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataSubjectRequest {
  id: number;
  tenantId: string;
  requestType: DsrType;
  subjectType: SubjectType;
  subjectId: number;
  subjectIdentifier: string;
  status: DsrStatus;
  receivedAt: string;
  dueDate: string;
  completedAt: string | null;
  evidenceUrl: string | null;
  handledByUserId: number | null;
  rejectionReason: string | null;
  createdAt: string;
  // server-computed (من GET /[id])
  daysRemaining?: number;
  isOverdue?: boolean;
}

type DsrType = 'ACCESS' | 'ERASE' | 'RECTIFY' | 'RESTRICT' | 'PORTABILITY';
type SubjectType = 'EMPLOYEE' | 'CUSTOMER' | 'VENDOR' | 'USER';
type DsrStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

interface CreateDsrForm {
  requestType: DsrType;
  subjectType: SubjectType;
  subjectId: string;
  subjectIdentifier: string;
}

interface ListResponse {
  items: DataSubjectRequest[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ─── ثوابت العرض ──────────────────────────────────────────────────────────────

const STATUS_META: Record<DsrStatus, { color: string; bg: string; ar: string; en: string }> = {
  RECEIVED:    { color: '#2563EB', bg: '#DBEAFE', ar: 'مُستلم',         en: 'Received' },
  IN_PROGRESS: { color: '#D97706', bg: '#FEF3C7', ar: 'قيد المعالجة',  en: 'In Progress' },
  COMPLETED:   { color: '#16A34A', bg: '#DCFCE7', ar: 'مكتمل',          en: 'Completed' },
  REJECTED:    { color: '#DC2626', bg: '#FEE2E2', ar: 'مرفوض',          en: 'Rejected' },
};

const REQUEST_TYPE_META: Record<DsrType, { ar: string; en: string; icon: React.ComponentType<any>; color: string }> = {
  ACCESS:      { ar: 'الوصول',         en: 'Access',      icon: Eye,           color: '#2563EB' },
  ERASE:       { ar: 'الحذف',          en: 'Erase',       icon: Trash2,        color: '#DC2626' },
  RECTIFY:     { ar: 'التصحيح',        en: 'Rectify',     icon: FileText,      color: '#D97706' },
  RESTRICT:    { ar: 'تقييد المعالجة', en: 'Restrict',    icon: AlertTriangle, color: '#7C3AED' },
  PORTABILITY: { ar: 'نقل البيانات',   en: 'Portability', icon: Download,      color: '#0891B2' },
};

const SUBJECT_TYPE_META: Record<SubjectType, { ar: string; en: string }> = {
  EMPLOYEE: { ar: 'موظف',   en: 'Employee' },
  CUSTOMER: { ar: 'عميل',   en: 'Customer' },
  VENDOR:   { ar: 'مورّد',   en: 'Vendor' },
  USER:     { ar: 'مستخدم', en: 'User' },
};

/**
 * تصدير CSV — نفس النمط المستخدم في breaches للاتساق.
 */
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

/** يحسب الفرق بالأيام بين تاريخين (يمكن سالب لو الموعد فات) */
function daysBetween(from: Date | string, to: Date | string = new Date()): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PdplDsrPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<DataSubjectRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<DsrStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<DsrType | ''>('');
  const [filterSubject, setFilterSubject] = useState<SubjectType | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);

  const [sortKey, setSortKey] = useState<keyof DataSubjectRequest>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDsrForm>({
    requestType: 'ACCESS',
    subjectType: 'CUSTOMER',
    subjectId: '',
    subjectIdentifier: '',
  });

  const [detailDsr, setDetailDsr] = useState<DataSubjectRequest | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchDsrs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filterStatus !== 'ALL') qs.set('status', filterStatus);
      if (filterType) qs.set('requestType', filterType);
      if (filterSubject) qs.set('subjectType', filterSubject);

      const res = await fetch(`/api/pdpl/dsr?${qs.toString()}`, {
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
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterStatus, filterType, filterSubject, lang]);

  useEffect(() => { void fetchDsrs(); }, [fetchDsrs]);

  // ─── Search + Sort (client-side على نتائج الصفحة الحالية) ─────────────────

  const filteredSorted = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    let result = items;
    if (q) {
      result = items.filter((d) =>
        [String(d.id), d.requestType, d.subjectType, d.status, d.subjectIdentifier, d.rejectionReason ?? '']
          .join(' ').toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, deferredSearch, sortKey, sortDir]);

  /** إحصاءات مع تركيز خاص على overdue (أهم metric هنا). */
  const stats = useMemo(() => {
    const open = items.filter((d) => d.status === 'RECEIVED' || d.status === 'IN_PROGRESS').length;
    const overdue = items.filter(
      (d) => (d.status === 'RECEIVED' || d.status === 'IN_PROGRESS') && new Date(d.dueDate) < new Date(),
    ).length;
    const dueSoon = items.filter((d) => {
      if (d.status !== 'RECEIVED' && d.status !== 'IN_PROGRESS') return false;
      const days = daysBetween(new Date(), d.dueDate);
      return days >= 0 && days <= 7;
    }).length;
    const completed = items.filter((d) => d.status === 'COMPLETED').length;
    return { open, overdue, dueSoon, completed, total };
  }, [items, total]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleSort = (key: keyof DataSubjectRequest) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const resetFilters = () => {
    setFilterStatus('ALL'); setFilterType(''); setFilterSubject(''); setSearchInput(''); setPage(1);
  };

  const handleExportCsv = () => {
    if (!filteredSorted.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = filteredSorted.map((d) => ({
      ID: d.id,
      RequestType: d.requestType,
      SubjectType: d.subjectType,
      SubjectId: d.subjectId,
      Identifier: d.subjectIdentifier,
      Status: d.status,
      ReceivedAt: d.receivedAt,
      DueDate: d.dueDate,
      CompletedAt: d.completedAt ?? '',
      DaysRemaining: daysBetween(new Date(), d.dueDate),
      RejectionReason: d.rejectionReason ?? '',
    }));
    exportToCsv(`pdpl-dsr-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        requestType: createForm.requestType,
        subjectType: createForm.subjectType,
        subjectId: Number(createForm.subjectId),
        subjectIdentifier: createForm.subjectIdentifier.trim(),
      };
      if (!payload.subjectId || payload.subjectId <= 0) {
        toastError(_t('معرّف الموضوع مطلوب', 'Subject ID required'));
        return;
      }
      if (!payload.subjectIdentifier) {
        toastError(_t('المُعرّف مطلوب', 'Identifier required'));
        return;
      }
      const res = await fetch('/api/pdpl/dsr', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم تسجيل الطلب', 'Submitted'));
      setShowCreate(false);
      setCreateForm({ requestType: 'ACCESS', subjectType: 'CUSTOMER', subjectId: '', subjectIdentifier: '' });
      await fetchDsrs();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCreating(false);
    }
  };

  // Esc لإغلاق المودالات
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowCreate(false); setDetailDsr(null); }
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
            <UserCog size={28} color="#2563EB" />
            {_t('طلبات أصحاب البيانات (PDPL)', 'Data Subject Requests (PDPL)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'إدارة طلبات الوصول/الحذف/التصحيح وفقاً للمادة 12 — الاستجابة إلزامية خلال 30 يوماً',
              'Access/Erase/Rectify requests per PDPL Art 12 — 30-day mandatory response',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchDsrs()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} />
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExportCsv} disabled={loading || !filteredSorted.length}>
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> {_t('طلب جديد', 'New Request')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<FileText size={22} color="#2563EB" />} label={_t('الإجمالي', 'Total')} value={stats.total} bg="#EFF6FF" />
        <StatCard icon={<Clock size={22} color="#D97706" />} label={_t('مفتوحة', 'Open')} value={stats.open} bg="#FEF3C7" />
        <StatCard icon={<AlertTriangle size={22} color="#DC2626" />} label={_t('متأخرة', 'Overdue')} value={stats.overdue} bg="#FEE2E2" />
        <StatCard icon={<Clock size={22} color="#9333EA" />} label={_t('تستحق خلال 7 أيام', 'Due in 7d')} value={stats.dueSoon} bg="#F3E8FF" />
        <StatCard icon={<CheckCircle2 size={22} color="#16A34A" />} label={_t('مكتملة', 'Completed')} value={stats.completed} bg="#DCFCE7" />
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
            placeholder={_t('ابحث برقم/نوع/معرّف...', 'Search by id/type/identifier...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
            aria-label={_t('بحث', 'Search')}
          />
        </div>

        <select
          className="input"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as DsrStatus | 'ALL'); setPage(1); }}
          style={{ minWidth: '150px' }}
          aria-label={_t('فلتر الحالة', 'Status filter')}
        >
          <option value="ALL">{_t('كل الحالات', 'All Statuses')}</option>
          {(Object.keys(STATUS_META) as DsrStatus[]).map((s) => (
            <option key={s} value={s}>{_t(STATUS_META[s].ar, STATUS_META[s].en)}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as DsrType | ''); setPage(1); }}
          style={{ minWidth: '150px' }}
          aria-label={_t('فلتر النوع', 'Type filter')}
        >
          <option value="">{_t('كل الأنواع', 'All Types')}</option>
          {(Object.keys(REQUEST_TYPE_META) as DsrType[]).map((t) => (
            <option key={t} value={t}>{_t(REQUEST_TYPE_META[t].ar, REQUEST_TYPE_META[t].en)}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterSubject}
          onChange={(e) => { setFilterSubject(e.target.value as SubjectType | ''); setPage(1); }}
          style={{ minWidth: '150px' }}
          aria-label={_t('فلتر صاحب البيانات', 'Subject filter')}
        >
          <option value="">{_t('كل الفئات', 'All Subjects')}</option>
          {(Object.keys(SUBJECT_TYPE_META) as SubjectType[]).map((s) => (
            <option key={s} value={s}>{_t(SUBJECT_TYPE_META[s].ar, SUBJECT_TYPE_META[s].en)}</option>
          ))}
        </select>

        <button type="button" className="btn btn-ghost" onClick={resetFilters}>
          {_t('تصفير', 'Reset')}
        </button>
      </div>

      {/* Content */}
      {loading && <TableSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchDsrs()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}
      {!loading && !loadError && filteredSorted.length === 0 && (
        <EmptyState
          icon={<UserCog size={48} color="var(--text-muted)" />}
          title={_t('لا توجد طلبات', 'No requests')}
          message={_t('لم تُسجَّل أي طلبات حتى الآن.', 'No requests recorded yet.')}
          actionLabel={_t('طلب جديد', 'New Request')}
          onAction={() => setShowCreate(true)}
        />
      )}

      {!loading && !loadError && filteredSorted.length > 0 && (
        <>
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <Th label="#" sortKey="id" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('النوع', 'Type')} sortKey="requestType" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('صاحب البيانات', 'Subject')} sortKey="subjectType" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th>{_t('المُعرّف', 'Identifier')}</th>
                  <Th label={_t('الحالة', 'Status')} sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('الاستلام', 'Received')} sortKey="receivedAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('الموعد النهائي', 'Due')} sortKey="dueDate" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th>{_t('متبقي', 'Remaining')}</th>
                  <th>{_t('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((d) => (
                  <DsrRow key={d.id} dsr={d} lang={lang} _t={_t} onOpen={() => setDetailDsr(d)} />
                ))}
              </tbody>
            </table>
          </div>

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
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>
                <UserCog size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('طلب جديد', 'New Request')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="df-type">{_t('نوع الطلب', 'Request Type')} *</label>
                    <select
                      id="df-type"
                      className="input"
                      required
                      value={createForm.requestType}
                      onChange={(e) => setCreateForm({ ...createForm, requestType: e.target.value as DsrType })}
                    >
                      {(Object.keys(REQUEST_TYPE_META) as DsrType[]).map((t) => (
                        <option key={t} value={t}>{_t(REQUEST_TYPE_META[t].ar, REQUEST_TYPE_META[t].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="df-subject">{_t('فئة صاحب البيانات', 'Subject Type')} *</label>
                    <select
                      id="df-subject"
                      className="input"
                      required
                      value={createForm.subjectType}
                      onChange={(e) => setCreateForm({ ...createForm, subjectType: e.target.value as SubjectType })}
                    >
                      {(Object.keys(SUBJECT_TYPE_META) as SubjectType[]).map((s) => (
                        <option key={s} value={s}>{_t(SUBJECT_TYPE_META[s].ar, SUBJECT_TYPE_META[s].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="df-id">{_t('معرّف الموضوع', 'Subject ID')} *</label>
                    <input
                      id="df-id"
                      type="number"
                      min={1}
                      className="input"
                      required
                      value={createForm.subjectId}
                      onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="df-ident">{_t('الهوية/الإقامة', 'ID/Iqama')} *</label>
                    <input
                      id="df-ident"
                      className="input"
                      required
                      maxLength={120}
                      value={createForm.subjectIdentifier}
                      onChange={(e) => setCreateForm({ ...createForm, subjectIdentifier: e.target.value })}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#EFF6FF',
                    border: '1px solid #93C5FD',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1E40AF',
                  }}
                >
                  <AlertTriangle size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                  {_t(
                    'الموعد النهائي 30 يوم من تاريخ الاستلام (PDPL Art 12).',
                    'Due date will be 30 days from receipt (PDPL Art 12).',
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>
                  {_t('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? _t('جارٍ الحفظ...', 'Saving...') : _t('تسجيل', 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailDsr && (
        <DsrDetailModal
          dsr={detailDsr}
          onClose={() => setDetailDsr(null)}
          onUpdated={async () => { setDetailDsr(null); await fetchDsrs(); }}
          _t={_t}
          lang={lang}
          toastSuccess={toastSuccess}
          toastError={toastError}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: bg }}>
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function Th({
  label, sortKey, current, dir, onSort,
}: {
  label: string;
  sortKey: keyof DataSubjectRequest;
  current: keyof DataSubjectRequest;
  dir: 'asc' | 'desc';
  onSort: (k: keyof DataSubjectRequest) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      role="button"
      tabIndex={0}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sortKey); } }}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label} {active ? (dir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}

function DsrRow({
  dsr, lang, _t, onOpen,
}: { dsr: DataSubjectRequest; lang: string; _t: (ar: string, en: string) => string; onOpen: () => void }) {
  const typeMeta = REQUEST_TYPE_META[dsr.requestType];
  const TypeIcon = typeMeta.icon;
  const statMeta = STATUS_META[dsr.status];
  const subjMeta = SUBJECT_TYPE_META[dsr.subjectType];
  const remaining = daysBetween(new Date(), dsr.dueDate);
  const isOverdue = (dsr.status === 'RECEIVED' || dsr.status === 'IN_PROGRESS') && remaining < 0;
  const isDueSoon = (dsr.status === 'RECEIVED' || dsr.status === 'IN_PROGRESS') && remaining >= 0 && remaining <= 7;

  return (
    <tr style={isOverdue ? { background: '#FEF2F220' } : undefined}>
      <td style={{ fontWeight: 600 }}>#{dsr.id}</td>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: typeMeta.color }}>
          <TypeIcon size={14} />
          {_t(typeMeta.ar, typeMeta.en)}
        </span>
      </td>
      <td>{_t(subjMeta.ar, subjMeta.en)}</td>
      <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
        {/* PII masking: لا نكشف الهوية كاملة في القائمة */}
        {dsr.subjectIdentifier.length > 6
          ? dsr.subjectIdentifier.slice(0, 3) + '***' + dsr.subjectIdentifier.slice(-3)
          : dsr.subjectIdentifier}
      </td>
      <td>
        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: statMeta.bg, color: statMeta.color }}>
          {_t(statMeta.ar, statMeta.en)}
        </span>
      </td>
      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {new Date(dsr.receivedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
      </td>
      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {new Date(dsr.dueDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
      </td>
      <td>
        {dsr.status === 'COMPLETED' || dsr.status === 'REJECTED' ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
        ) : isOverdue ? (
          <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 700 }}>
            {_t(`متأخر ${Math.abs(remaining)}ي`, `${Math.abs(remaining)}d late`)}
          </span>
        ) : isDueSoon ? (
          <span style={{ color: '#D97706', fontSize: '11px', fontWeight: 600 }}>
            {_t(`${remaining}ي متبقي`, `${remaining}d left`)}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {_t(`${remaining}ي`, `${remaining}d`)}
          </span>
        )}
      </td>
      <td>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onOpen}>
          {_t('فتح', 'Open')}
        </button>
      </td>
    </tr>
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

/**
 * Detail modal — يعرض كل البيانات ويتيح:
 *   - بدء المعالجة (RECEIVED → IN_PROGRESS) عبر PATCH
 *   - تنفيذ آلي (ACCESS/ERASE/PORTABILITY) عبر POST /fulfill
 *   - رفض مع سبب (لأي حالة مفتوحة) عبر PATCH
 */
function DsrDetailModal({
  dsr, onClose, onUpdated, _t, lang, toastSuccess, toastError,
}: {
  dsr: DataSubjectRequest;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  _t: (ar: string, en: string) => string;
  lang: string;
  toastSuccess: (m: string) => void;
  toastError: (m: string) => void;
}) {
  const [acting, setActing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [fulfillResult, setFulfillResult] = useState<unknown>(null);

  const remaining = daysBetween(new Date(), dsr.dueDate);
  const isOverdue = (dsr.status === 'RECEIVED' || dsr.status === 'IN_PROGRESS') && remaining < 0;
  const typeMeta = REQUEST_TYPE_META[dsr.requestType];
  const statMeta = STATUS_META[dsr.status];
  const canAutoFulfill = dsr.requestType === 'ACCESS' || dsr.requestType === 'ERASE' || dsr.requestType === 'PORTABILITY';
  const isClosed = dsr.status === 'COMPLETED' || dsr.status === 'REJECTED';

  const handleStart = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/pdpl/dsr/${dsr.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      toastSuccess(_t('بدأت المعالجة', 'Started'));
      await onUpdated();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setActing(false);
    }
  };

  const handleFulfill = async () => {
    const confirmMsg = dsr.requestType === 'ERASE'
      ? _t('هل أنت متأكد؟ سيتم إخفاء البيانات الشخصية لصاحب البيانات.', 'Are you sure? This will anonymize the subject data.')
      : _t('هل أنت متأكد؟ سيتم كشف البيانات الشخصية لصاحب البيانات.', 'Are you sure? This will reveal subject data.');
    if (!confirm(confirmMsg)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/pdpl/dsr/${dsr.id}/fulfill`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (!res.ok) throw new Error((result as { error?: string }).error || `HTTP ${res.status}`);
      setFulfillResult(result);
      toastSuccess(_t('تم التنفيذ', 'Fulfilled'));
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toastError(_t('سبب الرفض مطلوب', 'Reason required'));
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/pdpl/dsr/${dsr.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: rejectionReason.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      toastSuccess(_t('تم الرفض', 'Rejected'));
      await onUpdated();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>
            <UserCog size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
            {_t(`الطلب #${dsr.id}`, `Request #${dsr.id}`)}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label={_t('إغلاق', 'Close')}>✕</button>
        </div>

        <div className="modal-body">
          {isOverdue && (
            <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #DC2626', borderRadius: '8px', marginBottom: '16px', color: '#7F1D1D' }} role="alert">
              <AlertTriangle size={18} style={{ display: 'inline', marginInlineEnd: '6px' }} />
              {_t(
                `تجاوز المهلة بـ ${Math.abs(remaining)} يوم — مخاطر غرامة PDPL`,
                `Overdue by ${Math.abs(remaining)} days — PDPL fine risk`,
              )}
            </div>
          )}

          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <Field label={_t('نوع الطلب', 'Type')} value={_t(typeMeta.ar, typeMeta.en)} />
            <Field label={_t('الحالة', 'Status')} value={_t(statMeta.ar, statMeta.en)} />
            <Field label={_t('فئة صاحب البيانات', 'Subject Type')} value={_t(SUBJECT_TYPE_META[dsr.subjectType].ar, SUBJECT_TYPE_META[dsr.subjectType].en)} />
            <Field label={_t('معرّف الموضوع', 'Subject ID')} value={String(dsr.subjectId)} />
            <Field label={_t('المُعرّف (هوية)', 'Identifier (ID)')} value={dsr.subjectIdentifier} fullWidth />
            <Field label={_t('الاستلام', 'Received')} value={new Date(dsr.receivedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} />
            <Field label={_t('الموعد النهائي', 'Due Date')} value={new Date(dsr.dueDate).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} />
            {dsr.completedAt && (
              <Field label={_t('تاريخ الإكمال', 'Completed At')} value={new Date(dsr.completedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} />
            )}
            {dsr.rejectionReason && (
              <Field label={_t('سبب الرفض', 'Rejection Reason')} value={dsr.rejectionReason} fullWidth />
            )}
          </div>

          {fulfillResult !== null && fulfillResult !== undefined && (
            <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #16A34A', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '8px', color: '#15803D' }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                {_t('نتيجة التنفيذ', 'Fulfillment Result')}
              </h4>
              <pre
                style={{
                  fontSize: '12px',
                  background: 'white',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  direction: 'ltr',
                  textAlign: 'left',
                }}
              >
                {JSON.stringify(fulfillResult, null, 2)}
              </pre>
              <small style={{ color: 'var(--text-muted)' }}>
                {_t(
                  'يجب توصيل هذه البيانات لصاحب البيانات بطريقة آمنة (مغلف، بريد مشفر، إلخ).',
                  'Deliver these results to the data subject securely.',
                )}
              </small>
            </div>
          )}

          {showReject && !isClosed && (
            <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', marginBottom: '16px' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="rej-reason">{_t('سبب الرفض', 'Rejection Reason')} *</label>
                <textarea
                  id="rej-reason"
                  className="input"
                  rows={3}
                  maxLength={2000}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowReject(false); setRejectionReason(''); }}>
                  {_t('إلغاء', 'Cancel')}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleReject} disabled={acting}>
                  {_t('تأكيد الرفض', 'Confirm Reject')}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isClosed && !showReject && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {_t('إغلاق', 'Close')}
            </button>
            {dsr.status === 'RECEIVED' && (
              <button type="button" className="btn btn-secondary" onClick={handleStart} disabled={acting}>
                {_t('بدء المعالجة', 'Start Processing')}
              </button>
            )}
            <button type="button" className="btn btn-danger" onClick={() => setShowReject(true)} disabled={acting}>
              {_t('رفض', 'Reject')}
            </button>
            {canAutoFulfill && (
              <button type="button" className="btn btn-primary" onClick={handleFulfill} disabled={acting}>
                {dsr.requestType === 'ERASE'
                  ? _t('تنفيذ الحذف', 'Execute Erase')
                  : _t('تنفيذ الوصول', 'Execute Access')}
              </button>
            )}
          </div>
        )}

        {(isClosed || showReject) && !showReject && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {_t('إغلاق', 'Close')}
            </button>
          </div>
        )}
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
      <div style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
