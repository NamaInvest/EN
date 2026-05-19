'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  WHT Form 14 Dashboard — `/finance/wht/form14`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  نموذج 14 = الإقرار الشهري الموحد لضريبة الاستقطاع (WHT) المقدّم لـ ZATCA.
 *  المرجع: نظام ضريبة الاستقطاع — يجب تقديمه قبل 10 من الشهر التالي.
 *
 *  معدلات WHT المعتمدة:
 *   - 5%  : إيجار (Rent) من غير المقيمين
 *   - 5%  : خدمات فنية (Technical Services)
 *   - 5%  : إتاوات (Royalties)
 *   - 5%  : أرباح أسهم (Dividends)
 *   - 15% : خدمات إدارية (Management Fees)
 *   - 20% : أتعاب مدفوعة لمكاتب مهنية أجنبية
 *
 *  الميزات:
 *   ✅ قائمة batches بالـ status (DRAFT/SUBMITTED/FILED/REJECTED)
 *   ✅ توليد batch جديد لفترة (YYYY-MM)
 *   ✅ عرض تفاصيل batch + transactions
 *   ✅ تسجيل zatcaRef بعد التقديم
 *   ✅ Export CSV للتقديم اليدوي
 *   ✅ Stats: pending count, total WHT YTD
 *
 *  Permission: admin / owner / accountant / tax_officer / cfo
 *
 *  @see src/app/api/wht/form14/route.ts (list + detail)
 *  @see src/app/api/wht/form14/generate/route.ts (POST generate batch)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Calendar,
  Eye,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Form14Batch {
  id: number;
  period: string;
  totalGross: number | string;
  totalWht: number | string;
  status: BatchStatus;
  zatcaRef: string | null;
  filedAt: string | null;
  createdAt: string;
}

type BatchStatus = 'DRAFT' | 'SUBMITTED' | 'FILED' | 'REJECTED';

interface BatchDetail extends Form14Batch {
  transactions: Array<{
    id: number;
    baseAmount: number | string;
    whtRate: number | string;
    whtAmount: number | string;
    serviceCategory: string | null;
    supplier: { id: number; name: string };
    invoice: { id: number; invoiceNo: string | null; total: number | string; date: string };
  }>;
}

interface ListResponse {
  items: Form14Batch[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

const STATUS_META: Record<BatchStatus, { color: string; bg: string; ar: string; en: string }> = {
  DRAFT:     { color: '#64748B', bg: '#F1F5F9', ar: 'مسودة',     en: 'Draft' },
  SUBMITTED: { color: '#2563EB', bg: '#DBEAFE', ar: 'مُقدّم',     en: 'Submitted' },
  FILED:     { color: '#16A34A', bg: '#DCFCE7', ar: 'مُسجّل',     en: 'Filed' },
  REJECTED:  { color: '#DC2626', bg: '#FEE2E2', ar: 'مرفوض',     en: 'Rejected' },
};

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
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

/** اقتراح الفترة التالية للتقديم (الشهر السابق) */
function suggestedPeriod(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function WhtForm14Page() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  // ─── State ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<Form14Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPeriod, setGenPeriod] = useState(suggestedPeriod());

  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchBatches = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/wht/form14', {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      setLoadError(_t(`فشل التحميل: ${msg}`, `Load failed: ${msg}`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchBatches(); }, [fetchBatches]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!/^\d{4}-\d{2}$/.test(genPeriod)) {
      toastError(_t('الفترة يجب YYYY-MM', 'Period must be YYYY-MM'));
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/wht/form14/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: genPeriod }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t(`تم توليد batch للفترة ${genPeriod}`, `Batch generated for ${genPeriod}`));
      setShowGenModal(false);
      await fetchBatches();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setGenerating(false);
    }
  };

  const fetchDetail = async (period: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/wht/form14?period=${period}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as BatchDetail;
      setDetail(data);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportBatchCsv = () => {
    if (!detail) return;
    const rows = detail.transactions.map((tx) => ({
      ID: tx.id,
      SupplierID: tx.supplier?.id ?? '',
      SupplierName: tx.supplier?.name ?? '',
      InvoiceNo: tx.invoice?.invoiceNo ?? `#${tx.invoice?.id}`,
      InvoiceDate: tx.invoice?.date,
      InvoiceTotal: toNum(tx.invoice?.total),
      BaseAmount: toNum(tx.baseAmount),
      WhtRate: `${(toNum(tx.whtRate) * 100).toFixed(2)}%`,
      WhtAmount: toNum(tx.whtAmount),
      ServiceCategory: tx.serviceCategory ?? '',
    }));
    exportToCsv(`wht-form14-${detail.period}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  // إحصاءات
  const stats = {
    totalBatches: total,
    filed: items.filter((b) => b.status === 'FILED').length,
    pending: items.filter((b) => b.status === 'DRAFT' || b.status === 'SUBMITTED').length,
    totalWhtYtd: items
      .filter((b) => b.period.startsWith(String(new Date().getFullYear())))
      .reduce((s, b) => s + toNum(b.totalWht), 0),
  };

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowGenModal(false); setDetail(null); } };
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
            <FileText size={28} color="#7C3AED" />
            {_t('نموذج 14 — ضريبة الاستقطاع', 'WHT Form 14')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'الإقرار الشهري الموحّد لضريبة الاستقطاع المقدّم لـ ZATCA — تقديم قبل 10 من الشهر التالي',
              'Monthly WHT consolidated return for ZATCA — file by 10th of next month',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchBatches()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowGenModal(true)}>
            <Plus size={18} /> {_t('توليد batch', 'Generate Batch')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={<FileText size={20} color="#2563EB" />} label={_t('إجمالي Batches', 'Total Batches')} value={String(stats.totalBatches)} bg="#EFF6FF" />
        <StatCard icon={<CheckCircle2 size={20} color="#16A34A" />} label={_t('مُسجّلة', 'Filed')} value={String(stats.filed)} bg="#DCFCE7" />
        <StatCard icon={<Clock size={20} color="#D97706" />} label={_t('قيد الإجراء', 'Pending')} value={String(stats.pending)} bg="#FEF3C7" />
        <StatCard icon={<FileText size={20} color="#7C3AED" />} label={_t('WHT YTD', 'WHT YTD')} value={fmtSAR(stats.totalWhtYtd, lang)} bg="#F3E8FF" />
      </div>

      {/* Content */}
      {loading && <TableSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchBatches()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}
      {!loading && !loadError && items.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <FileText size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('لا توجد batches', 'No batches')}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {_t('ابدأ بتوليد batch للشهر السابق.', 'Start by generating a batch for last month.')}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowGenModal(true)}>
            <Plus size={16} style={{ marginInlineEnd: '6px' }} />
            {_t('توليد batch جديد', 'Generate Batch')}
          </button>
        </div>
      )}

      {!loading && !loadError && items.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{_t('الفترة', 'Period')}</th>
                <th>{_t('إجمالي الأساس', 'Total Gross')}</th>
                <th>{_t('إجمالي WHT', 'Total WHT')}</th>
                <th>{_t('الحالة', 'Status')}</th>
                <th>{_t('ZATCA Ref', 'ZATCA Ref')}</th>
                <th>{_t('تاريخ التقديم', 'Filed At')}</th>
                <th>{_t('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const meta = STATUS_META[b.status];
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{b.period}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtSAR(toNum(b.totalGross), lang)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>{fmtSAR(toNum(b.totalWht), lang)}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: meta.bg, color: meta.color }}>
                        {_t(meta.ar, meta.en)}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {b.zatcaRef || '—'}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {b.filedAt ? new Date(b.filedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void fetchDetail(b.period)}
                        aria-label={_t('عرض', 'View')}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Modal */}
      {showGenModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>
                <Send size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('توليد Batch جديد', 'Generate New Batch')}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowGenModal(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label" htmlFor="gen-period">
                  <Calendar size={12} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                  {_t('الفترة (YYYY-MM)', 'Period (YYYY-MM)')} *
                </label>
                <input
                  id="gen-period"
                  type="month"
                  className="input"
                  required
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                />
              </div>
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                <AlertTriangle size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t(
                  'سيتم تجميع كل WHT transactions في هذه الفترة وحساب الإجمالي. لو فيه batch موجود سيتم تحديثه.',
                  'All WHT transactions in this period will be aggregated. Existing batch will be updated.',
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowGenModal(false)} disabled={generating}>
                {_t('إلغاء', 'Cancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? _t('جاري التوليد...', 'Generating...') : _t('توليد', 'Generate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>
                <FileText size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                Form 14 — {detail.period}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <div className="modal-body">
              {detailLoading && <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div>}
              {!detailLoading && (
                <>
                  <div className="grid-2" style={{ gap: '12px', marginBottom: '20px' }}>
                    <Field label={_t('الفترة', 'Period')} value={detail.period} />
                    <Field label={_t('الحالة', 'Status')} value={_t(STATUS_META[detail.status].ar, STATUS_META[detail.status].en)} />
                    <Field label={_t('إجمالي الأساس', 'Total Gross')} value={fmtSAR(toNum(detail.totalGross), lang)} />
                    <Field label={_t('إجمالي WHT', 'Total WHT')} value={fmtSAR(toNum(detail.totalWht), lang)} />
                    {detail.zatcaRef && <Field label="ZATCA Ref" value={detail.zatcaRef} />}
                    {detail.filedAt && <Field label={_t('تاريخ التقديم', 'Filed At')} value={new Date(detail.filedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} />}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
                      {_t(`المعاملات (${detail.transactions?.length || 0})`, `Transactions (${detail.transactions?.length || 0})`)}
                    </h3>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleExportBatchCsv}>
                      <Download size={14} /> {_t('تصدير CSV', 'Export CSV')}
                    </button>
                  </div>

                  <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                    <table className="table" style={{ minWidth: '700px' }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{_t('المورد', 'Supplier')}</th>
                          <th>{_t('فاتورة', 'Invoice')}</th>
                          <th>{_t('الأساس', 'Base')}</th>
                          <th>{_t('النسبة', 'Rate')}</th>
                          <th>{_t('WHT', 'WHT')}</th>
                          <th>{_t('النوع', 'Type')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.transactions?.map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td style={{ fontSize: '12px' }}>{tx.supplier?.name || '—'}</td>
                            <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{tx.invoice?.invoiceNo || `#${tx.invoice?.id}`}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fmtSAR(toNum(tx.baseAmount), lang)}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{(toNum(tx.whtRate) * 100).toFixed(2)}%</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{fmtSAR(toNum(tx.whtAmount), lang)}</td>
                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.serviceCategory || '—'}</td>
                          </tr>
                        ))}
                        {(!detail.transactions || detail.transactions.length === 0) && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                              {_t('لا توجد معاملات', 'No transactions')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)}>{_t('إغلاق', 'Close')}</button>
            </div>
          </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
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
