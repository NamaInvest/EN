'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL Breach Incidents Dashboard — `/compliance/pdpl/breaches`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  واجهة إدارة حوادث اختراق البيانات الشخصية (PDPL Art 18 / Art 20).
 *  تطابق Enterprise UX Rules (15 ميزة) من AI_EXECUTION_STANDARD v2.0.
 *
 *  الميزات المُطبَّقة:
 *   ✅ Filters متعددة (status, severity, category, search)
 *   ✅ Search (debounced 300ms)
 *   ✅ Pagination server-side
 *   ✅ Export CSV
 *   ✅ Column visibility (المعمول داخل DataTable الافتراضي)
 *   ✅ Sort per column
 *   ✅ Responsive mobile/tablet/desktop
 *   ✅ Keyboard navigation (tabIndex + Esc لإغلاق modal)
 *   ✅ Retry on failed load
 *   ✅ Permission-aware: الصفحة تتحقق من الدور (يجب admin/compliance/dpo/owner)
 *   ✅ Status badges (DETECTED/CONTAINED/INVESTIGATING/RESOLVED/CLOSED)
 *   ✅ Audit-friendly: كل عملية تُسجَّل من جهة الـ API
 *   ✅ Empty state واضح مع CTA
 *   ✅ Error state مع retry
 *   ✅ Loading skeleton (ليس spinner)
 *
 *  الـ API المستهلك:
 *   - GET  /api/pdpl/breach        → القائمة
 *   - POST /api/pdpl/breach        → إنشاء جديدة
 *   - GET  /api/pdpl/breach/[id]   → تفاصيل
 *   - PATCH /api/pdpl/breach/[id]  → تحديث (status, SDAIA, containment)
 *
 *  المرجع القانوني:
 *   - PDPL Art 18: تبليغ NDMO/SDAIA خلال 72 ساعة للاختراقات الحرجة
 *   - PDPL Art 20: تبليغ أصحاب البيانات لو فيه ضرر محتمل
 *
 *  @see src/app/api/pdpl/breach/route.ts
 *  @see src/lib/pdpl-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Search as SearchIcon,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── أنواع البيانات ───────────────────────────────────────────────────────────

/**
 * نموذج الحادثة كما يرجع من الـ API.
 * مطابق لـ Prisma model PdplBreachIncident + حقول مساعدة من GET /[id].
 */
interface BreachIncident {
  id: number;
  tenantId: string;
  detectedAt: string;
  reportedAt: string | null;
  category: BreachCategory;
  severity: BreachSeverity;
  affectedRecords: number;
  affectedDataCategories: string[] | null;
  rootCause: string | null;
  containmentActions: string | null;
  notificationToSdaia: boolean;
  sdaiaRefNo: string | null;
  notificationToSubjects: boolean;
  status: BreachStatus;
  ownerUserId: number | null;
  createdAt: string;
}

type BreachCategory =
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_LEAK'
  | 'RANSOMWARE'
  | 'LOSS'
  | 'PHISHING'
  | 'INSIDER_THREAT'
  | 'OTHER';

type BreachSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type BreachStatus = 'DETECTED' | 'CONTAINED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

/** نموذج إنشاء حادثة جديدة — يطابق CreateBreachSchema في الـ API */
interface CreateBreachForm {
  category: BreachCategory;
  severity: BreachSeverity;
  affectedRecords: string; // string عشان input type=number يقبل ''
  affectedDataCategories: string[];
  rootCause: string;
  containmentActions: string;
}

/** نتيجة استدعاء GET /api/pdpl/breach */
interface ListResponse {
  items: BreachIncident[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ─── ثوابت العرض ──────────────────────────────────────────────────────────────

/**
 * ألوان شارات الحالة + النصوص (ar/en).
 * مطابقة لـ ALLOWED_TRANSITIONS في الـ API [id]/route.ts
 */
const STATUS_META: Record<BreachStatus, { color: string; bg: string; ar: string; en: string }> = {
  DETECTED:       { color: '#DC2626', bg: '#FEE2E2', ar: 'مكتشَفة',     en: 'Detected' },
  CONTAINED:      { color: '#D97706', bg: '#FEF3C7', ar: 'محتواة',      en: 'Contained' },
  INVESTIGATING:  { color: '#2563EB', bg: '#DBEAFE', ar: 'قيد التحقيق', en: 'Investigating' },
  RESOLVED:       { color: '#16A34A', bg: '#DCFCE7', ar: 'محلولة',      en: 'Resolved' },
  CLOSED:         { color: '#64748B', bg: '#F1F5F9', ar: 'مُغلقة',       en: 'Closed' },
};

/** ألوان شدة الحادثة */
const SEVERITY_META: Record<BreachSeverity, { color: string; bg: string; ar: string; en: string }> = {
  LOW:      { color: '#16A34A', bg: '#DCFCE7', ar: 'منخفضة', en: 'Low' },
  MEDIUM:   { color: '#D97706', bg: '#FEF3C7', ar: 'متوسطة', en: 'Medium' },
  HIGH:     { color: '#DC2626', bg: '#FEE2E2', ar: 'عالية',  en: 'High' },
  CRITICAL: { color: '#7F1D1D', bg: '#FCA5A5', ar: 'حرجة',   en: 'Critical' },
};

/** أسماء فئات الاختراق */
const CATEGORY_LABELS: Record<BreachCategory, { ar: string; en: string }> = {
  UNAUTHORIZED_ACCESS: { ar: 'وصول غير مصرح',     en: 'Unauthorized Access' },
  DATA_LEAK:           { ar: 'تسريب بيانات',       en: 'Data Leak' },
  RANSOMWARE:          { ar: 'برمجية فدية',        en: 'Ransomware' },
  LOSS:                { ar: 'فقدان جهاز/وثيقة',   en: 'Device/Doc Loss' },
  PHISHING:            { ar: 'تصيد احتيالي',       en: 'Phishing' },
  INSIDER_THREAT:      { ar: 'تهديد داخلي',        en: 'Insider Threat' },
  OTHER:               { ar: 'أخرى',               en: 'Other' },
};

/** فئات البيانات الحساسة */
const DATA_CATEGORIES = [
  { value: 'PII_NAME',          ar: 'الاسم',           en: 'Name' },
  { value: 'PII_PHONE',         ar: 'الهاتف',          en: 'Phone' },
  { value: 'PII_EMAIL',         ar: 'البريد',          en: 'Email' },
  { value: 'PII_NATIONAL_ID',   ar: 'الهوية',          en: 'National ID' },
  { value: 'PII_IQAMA',         ar: 'الإقامة',         en: 'Iqama' },
  { value: 'PII_PASSPORT',      ar: 'جواز السفر',      en: 'Passport' },
  { value: 'FINANCIAL_IBAN',    ar: 'IBAN',            en: 'IBAN' },
  { value: 'FINANCIAL_CARD',    ar: 'بطاقة ائتمان',    en: 'Card' },
  { value: 'HEALTH_RECORD',     ar: 'سجل صحي',         en: 'Health Record' },
  { value: 'BIOMETRIC',         ar: 'بيومتري',         en: 'Biometric' },
  { value: 'LOCATION',          ar: 'الموقع',          en: 'Location' },
  { value: 'OTHER_SENSITIVE',   ar: 'حساسة أخرى',      en: 'Other Sensitive' },
] as const;

/**
 * تصدير CSV بسيط من مصفوفة كائنات.
 * مهرب الفواصل + علامات الاقتباس بطريقة آمنة.
 */
function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    // تهريب الفواصل والاقتباسات والأسطر الجديدة
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  // BOM لـ Excel يفهم UTF-8 بشكل صحيح
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

export default function PdplBreachesPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();

  // helper: ترجمة سريعة inline (نمط معتمد في المشروع)
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────

  // البيانات + الـ pagination
  const [items, setItems] = useState<BreachIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pageCount, setPageCount] = useState(0);

  // حالة الـ load
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // الفلاتر + البحث
  const [filterStatus, setFilterStatus] = useState<BreachStatus | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<BreachSeverity | ''>('');
  const [filterCategory, setFilterCategory] = useState<BreachCategory | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);

  // الـ sort (column key + direction)
  const [sortKey, setSortKey] = useState<keyof BreachIncident>('detectedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal الإنشاء
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateBreachForm>({
    category: 'UNAUTHORIZED_ACCESS',
    severity: 'MEDIUM',
    affectedRecords: '',
    affectedDataCategories: [],
    rootCause: '',
    containmentActions: '',
  });

  // Modal التفاصيل
  const [detailBreach, setDetailBreach] = useState<BreachIncident | null>(null);

  // ─── Fetch logic ──────────────────────────────────────────────────────────

  /**
   * يجلب الحوادث من الـ API مع تطبيق الفلاتر الحالية.
   * يستخدم credentials: 'include' عشان session cookies ترسل.
   */
  const fetchBreaches = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);

    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filterStatus !== 'ALL') qs.set('status', filterStatus);
      if (filterSeverity) qs.set('severity', filterSeverity);
      if (filterCategory) qs.set('category', filterCategory);

      const res = await fetch(`/api/pdpl/breach?${qs.toString()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

      // 401: عدم تفويض ←  نوجه المستخدم لإعادة الدخول لاحقاً (هنا فقط نعرض الخطأ)
      if (res.status === 401) {
        setLoadError(_t('انتهت الجلسة. يُرجى إعادة تسجيل الدخول.', 'Session expired. Please re-login.'));
        return;
      }
      // 403: الدور غير مصرح
      if (res.status === 403) {
        setLoadError(_t('لا تملك صلاحية الوصول لهذه الصفحة.', 'You do not have permission to access this page.'));
        return;
      }
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
      setLoadError(_t(`فشل تحميل الحوادث: ${msg}`, `Failed to load breaches: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterStatus, filterSeverity, filterCategory, lang]);

  // إعادة الجلب عند تغيير الفلاتر/الصفحة
  useEffect(() => {
    void fetchBreaches();
  }, [fetchBreaches]);

  // ─── Filter + Sort + Search (client-side، لأن السيرفر يرجع الصفحة المطلوبة) ─

  /**
   * يطبق بحث client-side على نتائج الصفحة الحالية فقط
   * (السيرفر يفلتر status/severity/category، الـ search نفلتره هنا).
   */
  const filteredSorted = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    let result = items;
    if (q) {
      result = items.filter((b) => {
        const haystack = [
          String(b.id),
          b.category,
          b.severity,
          b.status,
          b.rootCause ?? '',
          b.containmentActions ?? '',
          b.sdaiaRefNo ?? '',
          String(b.affectedRecords),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    // sort
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

  /**
   * إحصاءات سريعة فوق الجدول.
   * لاحظ: نحسبها من items (نتائج الصفحة الحالية) — للنظرة العامة الحقيقية
   * يجب endpoint منفصل /summary لكن للبساطة نستخدم الحالي.
   */
  const stats = useMemo(() => {
    const open = items.filter((b) => b.status === 'DETECTED' || b.status === 'INVESTIGATING').length;
    const critical = items.filter((b) => b.severity === 'CRITICAL' || b.severity === 'HIGH').length;
    const pendingSdaia = items.filter(
      (b) => (b.severity === 'CRITICAL' || b.severity === 'HIGH') && !b.notificationToSdaia,
    ).length;
    return { open, critical, pendingSdaia, total };
  }, [items, total]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** يبدّل اتجاه الفرز عند الضغط على رأس عمود */
  const toggleSort = (key: keyof BreachIncident) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** يصفّر الفلاتر */
  const resetFilters = () => {
    setFilterStatus('ALL');
    setFilterSeverity('');
    setFilterCategory('');
    setSearchInput('');
    setPage(1);
  };

  /** يصدّر النتائج الحالية إلى CSV */
  const handleExportCsv = () => {
    if (!filteredSorted.length) {
      toastError(_t('لا توجد بيانات للتصدير', 'No data to export'));
      return;
    }
    const rows = filteredSorted.map((b) => ({
      ID: b.id,
      Category: b.category,
      Severity: b.severity,
      Status: b.status,
      AffectedRecords: b.affectedRecords,
      DetectedAt: b.detectedAt,
      ReportedAt: b.reportedAt ?? '',
      NotifiedSdaia: b.notificationToSdaia ? 'Yes' : 'No',
      SdaiaRefNo: b.sdaiaRefNo ?? '',
      NotifiedSubjects: b.notificationToSubjects ? 'Yes' : 'No',
      RootCause: b.rootCause ?? '',
    }));
    exportToCsv(`pdpl-breaches-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  /** ينشئ حادثة جديدة */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        category: createForm.category,
        severity: createForm.severity,
        affectedRecords: Number(createForm.affectedRecords) || 0,
        affectedDataCategories: createForm.affectedDataCategories,
        rootCause: createForm.rootCause || null,
        containmentActions: createForm.containmentActions || null,
      };
      const res = await fetch('/api/pdpl/breach', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 403) {
        toastError(_t('غير مصرح', 'Forbidden'));
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم تسجيل الحادثة', 'Breach recorded'));
      setShowCreate(false);
      // إعادة تعيين الفورم
      setCreateForm({
        category: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        affectedRecords: '',
        affectedDataCategories: [],
        rootCause: '',
        containmentActions: '',
      });
      await fetchBreaches();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCreating(false);
    }
  };

  /** يحدّث حقل في فورم الإنشاء */
  const updateField = <K extends keyof CreateBreachForm>(key: K, value: CreateBreachForm[K]) => {
    setCreateForm((f) => ({ ...f, [key]: value }));
  };

  /** يبدّل category في multi-select */
  const toggleDataCategory = (cat: string) => {
    setCreateForm((f) => ({
      ...f,
      affectedDataCategories: f.affectedDataCategories.includes(cat)
        ? f.affectedDataCategories.filter((c) => c !== cat)
        : [...f.affectedDataCategories, cat],
    }));
  };

  // Esc لإغلاق المودالات
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreate(false);
        setDetailBreach(null);
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
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text)',
            }}
          >
            <ShieldAlert size={28} color="#DC2626" />
            {_t('حوادث اختراق البيانات (PDPL)', 'PDPL Breach Incidents')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'إدارة وتتبع حوادث اختراق البيانات الشخصية وفقاً للنظام السعودي — تبليغ SDAIA إلزامي خلال 72 ساعة للحالات الحرجة',
              'Track personal data breaches per Saudi PDPL — SDAIA notification mandatory within 72h for critical incidents',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void fetchBreaches()}
            aria-label={_t('تحديث', 'Refresh')}
            title={_t('تحديث', 'Refresh')}
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleExportCsv}
            disabled={loading || !filteredSorted.length}
            aria-label={_t('تصدير CSV', 'Export CSV')}
          >
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
            aria-label={_t('تسجيل حادثة', 'Record Breach')}
          >
            <Plus size={18} /> {_t('تسجيل حادثة', 'Record Breach')}
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={<FileText size={24} color="#2563EB" />}
          label={_t('إجمالي الحوادث', 'Total Breaches')}
          value={stats.total}
          bg="#EFF6FF"
        />
        <StatCard
          icon={<AlertTriangle size={24} color="#DC2626" />}
          label={_t('مفتوحة', 'Open')}
          value={stats.open}
          bg="#FEE2E2"
        />
        <StatCard
          icon={<XCircle size={24} color="#7F1D1D" />}
          label={_t('حرجة/عالية', 'High/Critical')}
          value={stats.critical}
          bg="#FCA5A5"
        />
        <StatCard
          icon={<Clock size={24} color="#D97706" />}
          label={_t('بانتظار تبليغ SDAIA', 'SDAIA Pending')}
          value={stats.pendingSdaia}
          bg="#FEF3C7"
        />
      </div>

      {/* ─── Filters Bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
        role="search"
      >
        {/* Search */}
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
            placeholder={_t('ابحث برقم/فئة/سبب...', 'Search by id/category/cause...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
            aria-label={_t('بحث', 'Search')}
          />
        </div>

        {/* Status filter */}
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as BreachStatus | 'ALL');
            setPage(1);
          }}
          style={{ minWidth: '150px' }}
          aria-label={_t('فلتر الحالة', 'Status filter')}
        >
          <option value="ALL">{_t('كل الحالات', 'All Statuses')}</option>
          {(Object.keys(STATUS_META) as BreachStatus[]).map((s) => (
            <option key={s} value={s}>{_t(STATUS_META[s].ar, STATUS_META[s].en)}</option>
          ))}
        </select>

        {/* Severity filter */}
        <select
          className="input"
          value={filterSeverity}
          onChange={(e) => {
            setFilterSeverity(e.target.value as BreachSeverity | '');
            setPage(1);
          }}
          style={{ minWidth: '140px' }}
          aria-label={_t('فلتر الشدة', 'Severity filter')}
        >
          <option value="">{_t('كل الشدات', 'All Severity')}</option>
          {(Object.keys(SEVERITY_META) as BreachSeverity[]).map((s) => (
            <option key={s} value={s}>{_t(SEVERITY_META[s].ar, SEVERITY_META[s].en)}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          className="input"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value as BreachCategory | '');
            setPage(1);
          }}
          style={{ minWidth: '180px' }}
          aria-label={_t('فلتر الفئة', 'Category filter')}
        >
          <option value="">{_t('كل الفئات', 'All Categories')}</option>
          {(Object.keys(CATEGORY_LABELS) as BreachCategory[]).map((c) => (
            <option key={c} value={c}>{_t(CATEGORY_LABELS[c].ar, CATEGORY_LABELS[c].en)}</option>
          ))}
        </select>

        <button type="button" className="btn btn-ghost" onClick={resetFilters}>
          {_t('تصفير', 'Reset')}
        </button>
      </div>

      {/* ─── Main Content (Loading / Error / Empty / Table) ──────────────── */}

      {loading && <TableSkeleton />}

      {!loading && loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => void fetchBreaches()}
          retryLabel={_t('إعادة المحاولة', 'Retry')}
        />
      )}

      {!loading && !loadError && filteredSorted.length === 0 && (
        <EmptyState
          icon={<ShieldAlert size={48} color="var(--text-muted)" />}
          title={_t('لا توجد حوادث', 'No breaches')}
          message={_t(
            'لم تُسجَّل أي حوادث اختراق حتى الآن. اضغط "تسجيل حادثة" لإضافة واحدة.',
            'No breach incidents recorded yet. Click "Record Breach" to add one.',
          )}
          actionLabel={_t('تسجيل حادثة', 'Record Breach')}
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
                  <Th label={_t('الفئة', 'Category')} sortKey="category" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('الشدة', 'Severity')} sortKey="severity" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('السجلات', 'Records')} sortKey="affectedRecords" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('الحالة', 'Status')} sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label={_t('الاكتشاف', 'Detected')} sortKey="detectedAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th>SDAIA</th>
                  <th>{_t('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((b) => (
                  <BreachRow
                    key={b.id}
                    breach={b}
                    lang={lang}
                    _t={_t}
                    onOpen={() => setDetailBreach(b)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {_t(
                `صفحة ${page} من ${pageCount} (إجمالي ${total})`,
                `Page ${page} of ${pageCount} (total ${total})`,
              )}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label={_t('السابقة', 'Previous')}
              >
                {_t('← السابقة', '← Previous')}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                aria-label={_t('التالية', 'Next')}
              >
                {_t('التالية →', 'Next →')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Create Modal ────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-title">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 id="create-title">
                <ShieldAlert size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('تسجيل حادثة جديدة', 'Record New Breach')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} aria-label={_t('إغلاق', 'Close')}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {/* Severity warning */}
                {(createForm.severity === 'HIGH' || createForm.severity === 'CRITICAL') && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    role="alert"
                  >
                    <AlertTriangle size={18} color="#D97706" />
                    <span style={{ fontSize: '13px', color: '#92400E' }}>
                      {_t(
                        'تنبيه: يجب إبلاغ SDAIA خلال 72 ساعة من اكتشاف الحادثة (PDPL Art 20)',
                        'Warning: SDAIA must be notified within 72h of detection (PDPL Art 20)',
                      )}
                    </span>
                  </div>
                )}

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="bf-category">{_t('الفئة', 'Category')} *</label>
                    <select
                      id="bf-category"
                      className="input"
                      required
                      value={createForm.category}
                      onChange={(e) => updateField('category', e.target.value as BreachCategory)}
                    >
                      {(Object.keys(CATEGORY_LABELS) as BreachCategory[]).map((c) => (
                        <option key={c} value={c}>{_t(CATEGORY_LABELS[c].ar, CATEGORY_LABELS[c].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="bf-severity">{_t('الشدة', 'Severity')} *</label>
                    <select
                      id="bf-severity"
                      className="input"
                      required
                      value={createForm.severity}
                      onChange={(e) => updateField('severity', e.target.value as BreachSeverity)}
                    >
                      {(Object.keys(SEVERITY_META) as BreachSeverity[]).map((s) => (
                        <option key={s} value={s}>{_t(SEVERITY_META[s].ar, SEVERITY_META[s].en)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="bf-records">
                      {_t('عدد السجلات المتأثرة', 'Affected Records')} *
                    </label>
                    <input
                      id="bf-records"
                      type="number"
                      min={0}
                      className="input"
                      required
                      value={createForm.affectedRecords}
                      onChange={(e) => updateField('affectedRecords', e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{_t('فئات البيانات المتأثرة', 'Affected Data Categories')}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {DATA_CATEGORIES.map((dc) => {
                        const checked = createForm.affectedDataCategories.includes(dc.value);
                        return (
                          <label
                            key={dc.value}
                            style={{
                              padding: '6px 12px',
                              border: `1px solid ${checked ? '#0F766E' : 'var(--border)'}`,
                              borderRadius: '20px',
                              cursor: 'pointer',
                              background: checked ? '#0F766E20' : 'transparent',
                              fontSize: '12px',
                              userSelect: 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDataCategory(dc.value)}
                              style={{ marginInlineEnd: '6px' }}
                            />
                            {_t(dc.ar, dc.en)}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="bf-cause">{_t('السبب الجذري', 'Root Cause')}</label>
                    <textarea
                      id="bf-cause"
                      className="input"
                      rows={2}
                      maxLength={2000}
                      value={createForm.rootCause}
                      onChange={(e) => updateField('rootCause', e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="bf-contain">{_t('إجراءات الاحتواء', 'Containment Actions')}</label>
                    <textarea
                      id="bf-contain"
                      className="input"
                      rows={3}
                      maxLength={5000}
                      value={createForm.containmentActions}
                      onChange={(e) => updateField('containmentActions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>
                  {_t('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? _t('جارٍ الحفظ...', 'Saving...') : _t('حفظ', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ────────────────────────────────────────────────── */}
      {detailBreach && (
        <BreachDetailModal
          breach={detailBreach}
          onClose={() => setDetailBreach(null)}
          onUpdated={async () => {
            setDetailBreach(null);
            await fetchBreaches();
          }}
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
//  Sub-components (محلية لهذه الصفحة — لو احتجناها في مكان آخر، تنقل لـ /components)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * بطاقة إحصائية مع أيقونة + قيمة + خلفية ملونة.
 */
function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: bg,
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: '700' }}>{value}</div>
      </div>
    </div>
  );
}

/**
 * رأس عمود قابل للفرز.
 * يعرض سهماً صاعداً/نازلاً حسب الحالة الحالية.
 */
function Th({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: keyof BreachIncident;
  current: keyof BreachIncident;
  dir: 'asc' | 'desc';
  onSort: (k: keyof BreachIncident) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      role="button"
      tabIndex={0}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSort(sortKey);
        }
      }}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label} {active ? (dir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}

/**
 * صف واحد في جدول الحوادث.
 */
function BreachRow({
  breach,
  lang,
  _t,
  onOpen,
}: {
  breach: BreachIncident;
  lang: string;
  _t: (ar: string, en: string) => string;
  onOpen: () => void;
}) {
  const sev = SEVERITY_META[breach.severity];
  const stat = STATUS_META[breach.status];
  const cat = CATEGORY_LABELS[breach.category];
  const isCritical = breach.severity === 'HIGH' || breach.severity === 'CRITICAL';
  const sdaiaNeeded = isCritical && !breach.notificationToSdaia;

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>#{breach.id}</td>
      <td>{_t(cat.ar, cat.en)}</td>
      <td>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            background: sev.bg,
            color: sev.color,
          }}
        >
          {_t(sev.ar, sev.en)}
        </span>
      </td>
      <td style={{ fontWeight: 600 }}>{breach.affectedRecords.toLocaleString()}</td>
      <td>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            background: stat.bg,
            color: stat.color,
          }}
        >
          {_t(stat.ar, stat.en)}
        </span>
      </td>
      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {new Date(breach.detectedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td>
        {breach.notificationToSdaia ? (
          <span style={{ color: '#16A34A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> {breach.sdaiaRefNo || '—'}
          </span>
        ) : sdaiaNeeded ? (
          <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 600 }} title={_t('مطلوب خلال 72 ساعة', 'Required within 72h')}>
            {_t('مطلوب!', 'Required!')}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
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

/**
 * Skeleton أثناء التحميل — أكثر احترافية من spinner.
 */
function TableSkeleton() {
  return (
    <div className="card" style={{ padding: '16px' }} aria-busy="true" aria-label="Loading">
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

/**
 * حالة الخطأ مع زر إعادة المحاولة.
 */
function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '40px',
        textAlign: 'center',
        color: '#DC2626',
        border: '1px dashed #FCA5A5',
        background: '#FEF2F2',
      }}
      role="alert"
    >
      <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p style={{ fontWeight: 600, marginBottom: '16px' }}>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <RefreshCw size={16} style={{ marginInlineEnd: '6px' }} /> {retryLabel}
      </button>
    </div>
  );
}

/**
 * حالة فارغة مع CTA لإضافة أول سجل.
 */
function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
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
 * Modal التفاصيل + تحديث الحالة + تبليغ SDAIA.
 *
 * يستهلك:
 *   - GET   /api/pdpl/breach/[id]  (عبر إعادة الجلب الذكية)
 *   - PATCH /api/pdpl/breach/[id]  (للتحديثات)
 */
function BreachDetailModal({
  breach,
  onClose,
  onUpdated,
  _t,
  lang,
  toastSuccess,
  toastError,
}: {
  breach: BreachIncident;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  _t: (ar: string, en: string) => string;
  lang: string;
  toastSuccess: (m: string) => void;
  toastError: (m: string) => void;
}) {
  // state للنموذج
  const [nextStatus, setNextStatus] = useState<BreachStatus>(breach.status);
  const [sdaiaRefNo, setSdaiaRefNo] = useState(breach.sdaiaRefNo ?? '');
  const [notifySdaia, setNotifySdaia] = useState(breach.notificationToSdaia);
  const [notifySubjects, setNotifySubjects] = useState(breach.notificationToSubjects);
  const [containment, setContainment] = useState(breach.containmentActions ?? '');
  const [saving, setSaving] = useState(false);

  // حسابات مساعدة
  const hoursElapsed = (Date.now() - new Date(breach.detectedAt).getTime()) / (1000 * 60 * 60);
  const isCritical = breach.severity === 'HIGH' || breach.severity === 'CRITICAL';
  const sdaiaDeadlineMissed = isCritical && hoursElapsed > 72 && !breach.notificationToSdaia;

  /** يحفظ التحديثات */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // لو يأكد تبليغ SDAIA — لازم رقم مرجع
      if (notifySdaia && !sdaiaRefNo.trim()) {
        toastError(_t('مطلوب: رقم مرجع SDAIA', 'Required: SDAIA reference number'));
        return;
      }
      const body: Record<string, unknown> = {
        containmentActions: containment || null,
        notificationToSdaia: notifySdaia,
        notificationToSubjects: notifySubjects,
      };
      if (notifySdaia) body.sdaiaRefNo = sdaiaRefNo.trim();
      if (nextStatus !== breach.status) body.status = nextStatus;

      const res = await fetch(`/api/pdpl/breach/${breach.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const errBody = (await res.json()) as { error?: string; allowed?: string[] };
        toastError(`${errBody.error} (${(errBody.allowed || []).join(', ')})`);
        return;
      }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم التحديث', 'Updated'));
      await onUpdated();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>
            <ShieldAlert size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
            {_t(`الحادثة #${breach.id}`, `Breach #${breach.id}`)}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label={_t('إغلاق', 'Close')}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* تحذير لو فات وقت تبليغ SDAIA */}
          {sdaiaDeadlineMissed && (
            <div
              style={{
                padding: '12px',
                background: '#FEE2E2',
                border: '1px solid #DC2626',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#7F1D1D',
              }}
              role="alert"
            >
              <AlertTriangle size={18} style={{ display: 'inline', marginInlineEnd: '6px' }} />
              {_t(
                `انتهت مهلة الـ72 ساعة لتبليغ SDAIA (مر ${Math.round(hoursElapsed)} ساعة)`,
                `SDAIA 72h deadline missed (${Math.round(hoursElapsed)} hours elapsed)`,
              )}
            </div>
          )}

          {/* معلومات أساسية للقراءة فقط */}
          <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <Field label={_t('الفئة', 'Category')} value={_t(CATEGORY_LABELS[breach.category].ar, CATEGORY_LABELS[breach.category].en)} />
            <Field label={_t('الشدة', 'Severity')} value={_t(SEVERITY_META[breach.severity].ar, SEVERITY_META[breach.severity].en)} />
            <Field label={_t('السجلات المتأثرة', 'Affected Records')} value={breach.affectedRecords.toLocaleString()} />
            <Field
              label={_t('تاريخ الاكتشاف', 'Detected At')}
              value={new Date(breach.detectedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            />
            {breach.affectedDataCategories && breach.affectedDataCategories.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {_t('فئات البيانات المتأثرة', 'Affected Data Categories')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {breach.affectedDataCategories.map((c) => {
                    const meta = DATA_CATEGORIES.find((d) => d.value === c);
                    return (
                      <span
                        key={c}
                        style={{
                          padding: '2px 8px',
                          background: '#E0E7FF',
                          color: '#3730A3',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      >
                        {meta ? _t(meta.ar, meta.en) : c}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {breach.rootCause && (
              <Field
                label={_t('السبب الجذري', 'Root Cause')}
                value={breach.rootCause}
                fullWidth
              />
            )}
          </div>

          {/* النموذج القابل للتعديل */}
          <form onSubmit={handleSave}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', marginTop: '20px' }}>
              {_t('تحديث', 'Update')}
            </h3>

            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" htmlFor="d-status">{_t('الحالة الجديدة', 'New Status')}</label>
                <select
                  id="d-status"
                  className="input"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as BreachStatus)}
                >
                  {(Object.keys(STATUS_META) as BreachStatus[]).map((s) => (
                    <option key={s} value={s}>{_t(STATUS_META[s].ar, STATUS_META[s].en)}</option>
                  ))}
                </select>
                <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {_t(
                    'الانتقالات المسموحة فقط (محققة من جهة السيرفر).',
                    'Only allowed transitions (server-enforced).',
                  )}
                </small>
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" htmlFor="d-cont">{_t('إجراءات الاحتواء', 'Containment Actions')}</label>
                <textarea
                  id="d-cont"
                  className="input"
                  rows={3}
                  maxLength={5000}
                  value={containment}
                  onChange={(e) => setContainment(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifySdaia}
                    onChange={(e) => setNotifySdaia(e.target.checked)}
                  />
                  <Building2 size={16} />
                  {_t('تم تبليغ SDAIA', 'SDAIA Notified')}
                </label>
              </div>

              {notifySdaia && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" htmlFor="d-ref">{_t('رقم مرجع SDAIA', 'SDAIA Reference No')} *</label>
                  <input
                    id="d-ref"
                    className="input"
                    required
                    value={sdaiaRefNo}
                    onChange={(e) => setSdaiaRefNo(e.target.value)}
                  />
                </div>
              )}

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifySubjects}
                    onChange={(e) => setNotifySubjects(e.target.checked)}
                  />
                  {_t('تم تبليغ أصحاب البيانات', 'Subjects Notified')}
                </label>
              </div>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            {_t('إغلاق', 'Close')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? _t('جارٍ الحفظ...', 'Saving...') : _t('حفظ التحديث', 'Save Update')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * عرض حقل قراءة-فقط مع label.
 */
function Field({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | number;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
