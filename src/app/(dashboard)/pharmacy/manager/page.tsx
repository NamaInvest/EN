'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Pharmacy Manager — `/pharmacy/manager`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة الصيدلية الكاملة:
 *   - CRUD الأدوية مع تحكم بالمحكومة (controlled substances)
 *   - تتبع تواريخ الانتهاء
 *   - فلترة + بحث + تصدير
 *
 *  Endpoints:
 *   GET  /api/pharmacy/drugs   → قائمة كاملة مع filters
 *   POST /api/pharmacy/drugs   → إنشاء دواء جديد
 *
 *  Permission: admin / pharmacy_manager / pharmacist
 *
 *  @see src/app/api/pharmacy/drugs/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
  Pill, Plus, RefreshCw, Download, Search as SearchIcon,
  ShieldAlert, AlertTriangle, XCircle, CheckCircle2, Calendar, Package,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Drug {
  id: number;
  name: string;
  genericName?: string | null;
  manufacturer?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  registrationNumber?: string | null;
  isControlled?: boolean;
  stockQty?: number;
  price?: number | string;
  expiryDate?: string | null;
  category?: string | null;
}

interface CreateDrugForm {
  name: string;
  genericName: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  registrationNumber: string;
  isControlled: boolean;
  price: string;
  expiryDate: string;
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency', currency: 'SAR', maximumFractionDigits: 2,
  }).format(n);
}

function daysToExpiry(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PharmacyManagerPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);
  const [filterControlled, setFilterControlled] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [filterExpiry, setFilterExpiry] = useState<'ALL' | 'EXPIRED' | 'SOON' | 'OK'>('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateDrugForm>({
    name: '', genericName: '', manufacturer: '', dosageForm: '', strength: '',
    registrationNumber: '', isControlled: false, price: '', expiryDate: '',
  });

  const fetchDrugs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/pharmacy/drugs', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items ?? data.drugs ?? []);
      setDrugs(list);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchDrugs(); }, [fetchDrugs]);

  const filteredDrugs = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    let result = drugs;
    if (q) {
      result = result.filter((d) =>
        [String(d.id), d.name, d.genericName ?? '', d.manufacturer ?? '', d.registrationNumber ?? '']
          .join(' ').toLowerCase().includes(q),
      );
    }
    if (filterControlled !== 'ALL') {
      result = result.filter((d) => (filterControlled === 'YES') === !!d.isControlled);
    }
    if (filterExpiry !== 'ALL') {
      result = result.filter((d) => {
        const days = daysToExpiry(d.expiryDate);
        if (days === null) return filterExpiry === 'OK';
        if (filterExpiry === 'EXPIRED') return days < 0;
        if (filterExpiry === 'SOON') return days >= 0 && days <= 90;
        return days > 90;
      });
    }
    return result;
  }, [drugs, deferredSearch, filterControlled, filterExpiry]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toastError(_t('اسم الدواء مطلوب', 'Drug name required')); return; }

    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        genericName: form.genericName.trim() || null,
        manufacturer: form.manufacturer.trim() || null,
        dosageForm: form.dosageForm.trim() || null,
        strength: form.strength.trim() || null,
        registrationNumber: form.registrationNumber.trim() || null,
        isControlled: form.isControlled,
        price: form.price ? Number(form.price) : null,
        expiryDate: form.expiryDate || null,
      };

      const res = await fetch('/api/pharmacy/drugs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم إنشاء الدواء', 'Drug created'));
      setShowCreate(false);
      setForm({ name: '', genericName: '', manufacturer: '', dosageForm: '', strength: '',
        registrationNumber: '', isControlled: false, price: '', expiryDate: '' });
      await fetchDrugs();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    if (!filteredDrugs.length) { toastError(_t('لا توجد بيانات', 'No data')); return; }
    const rows = filteredDrugs.map((d) => ({
      ID: d.id,
      Name: d.name,
      GenericName: d.genericName ?? '',
      Manufacturer: d.manufacturer ?? '',
      DosageForm: d.dosageForm ?? '',
      Strength: d.strength ?? '',
      RegistrationNumber: d.registrationNumber ?? '',
      IsControlled: d.isControlled ? 'YES' : 'NO',
      Price: toNum(d.price),
      ExpiryDate: d.expiryDate ?? '',
      DaysToExpiry: daysToExpiry(d.expiryDate) ?? '',
    }));
    exportToCsv(`pharmacy-drugs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toastSuccess(_t('تم التصدير', 'Exported'));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreate(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={28} color="#16A34A" />
            {_t('إدارة الصيدلية', 'Pharmacy Manager')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t('إدارة الأدوية + المخزون + تواريخ الانتهاء + الأدوية المحكومة', 'Drugs + stock + expiry + controlled substances')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/pharmacy" className="btn btn-ghost"><Pill size={16} /> {_t('لوحة الصيدلية', 'Pharmacy Dashboard')}</a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchDrugs()}><RefreshCw size={18} className={loading ? 'pm-spin' : ''} /></button>
          <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={loading || !filteredDrugs.length}>
            <Download size={18} /> {_t('تصدير', 'Export')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> {_t('دواء جديد', 'New Drug')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <SearchIcon size={18} style={{ position: 'absolute', [lang === 'ar' ? 'right' : 'left']: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input"
            placeholder={_t('ابحث برقم/اسم/مصنع...', 'Search by ID/name/manufacturer...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '36px' } as React.CSSProperties}
          />
        </div>
        <select className="input" value={filterControlled} onChange={(e) => setFilterControlled(e.target.value as 'ALL' | 'YES' | 'NO')} style={{ minWidth: '160px' }}>
          <option value="ALL">{_t('كل الأدوية', 'All Drugs')}</option>
          <option value="YES">{_t('محكومة فقط', 'Controlled Only')}</option>
          <option value="NO">{_t('عادية فقط', 'Non-Controlled')}</option>
        </select>
        <select className="input" value={filterExpiry} onChange={(e) => setFilterExpiry(e.target.value as any)} style={{ minWidth: '170px' }}>
          <option value="ALL">{_t('كل التواريخ', 'All Dates')}</option>
          <option value="EXPIRED">{_t('منتهية', 'Expired')}</option>
          <option value="SOON">{_t('قاربت الصلاحية (90د)', 'Expiring Soon (90d)')}</option>
          <option value="OK">{_t('سارية', 'Valid')}</option>
        </select>
      </div>

      {/* Content */}
      {loading && <Skeleton />}
      {!loading && loadError && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#DC2626', border: '1px dashed #FCA5A5', background: '#FEF2F2' }} role="alert">
          <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 600, marginBottom: '16px' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchDrugs()}>
            <RefreshCw size={16} style={{ marginInlineEnd: '6px' }} /> {_t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}
      {!loading && !loadError && filteredDrugs.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Pill size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{_t('لا توجد أدوية', 'No drugs')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>{_t('أضف دواء جديد للبدء.', 'Add a drug to get started.')}</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> {_t('دواء جديد', 'New Drug')}</button>
        </div>
      )}

      {!loading && !loadError && filteredDrugs.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>{_t('الاسم', 'Name')}</th>
                <th>{_t('الاسم العلمي', 'Generic')}</th>
                <th>{_t('المصنع', 'Manufacturer')}</th>
                <th>{_t('الشكل/التركيز', 'Form/Strength')}</th>
                <th>{_t('السعر', 'Price')}</th>
                <th>{_t('الصلاحية', 'Expiry')}</th>
                <th>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.map((d) => {
                const days = daysToExpiry(d.expiryDate);
                const expiredStyle = days !== null && days < 0 ? { background: '#FEF2F220' } : days !== null && days <= 90 ? { background: '#FEF3C720' } : undefined;
                return (
                  <tr key={d.id} style={expiredStyle}>
                    <td style={{ fontWeight: 600 }}>#{d.id}</td>
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.genericName || '—'}</td>
                    <td style={{ fontSize: '12px' }}>{d.manufacturer || '—'}</td>
                    <td style={{ fontSize: '12px' }}>
                      {[d.dosageForm, d.strength].filter(Boolean).join(' • ') || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{d.price ? fmtSAR(toNum(d.price), lang) : '—'}</td>
                    <td style={{ fontSize: '12px' }}>
                      {d.expiryDate ? (
                        <>
                          {new Date(d.expiryDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          {days !== null && days < 0 && <div style={{ color: '#DC2626', fontWeight: 600, fontSize: '11px' }}>{_t(`منتهي منذ ${Math.abs(days)}ي`, `Expired ${Math.abs(days)}d ago`)}</div>}
                          {days !== null && days >= 0 && days <= 90 && <div style={{ color: '#D97706', fontWeight: 600, fontSize: '11px' }}>{_t(`${days}ي`, `${days}d left`)}</div>}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {d.isControlled ? (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={11} /> {_t('محكوم', 'Controlled')}
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={11} /> {_t('عادي', 'Normal')}
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

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2><Plus size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />{_t('دواء جديد', 'New Drug')}</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="pm-name">{_t('اسم الدواء', 'Drug Name')} *</label>
                    <input id="pm-name" className="input" required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-gen">{_t('الاسم العلمي', 'Generic Name')}</label>
                    <input id="pm-gen" className="input" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-mfr">{_t('المصنع', 'Manufacturer')}</label>
                    <input id="pm-mfr" className="input" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-form">{_t('الشكل (حبة/شراب/كبسولة)', 'Form (tablet/syrup/capsule)')}</label>
                    <input id="pm-form" className="input" value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-str">{_t('التركيز', 'Strength')}</label>
                    <input id="pm-str" className="input" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="500mg" />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-reg">{_t('رقم التسجيل (SFDA)', 'SFDA Registration No')}</label>
                    <input id="pm-reg" className="input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-price">{_t('السعر (SAR)', 'Price (SAR)')}</label>
                    <input id="pm-price" type="number" step="0.01" min={0} className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="pm-exp">{_t('تاريخ الانتهاء', 'Expiry Date')}</label>
                    <input id="pm-exp" type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.isControlled} onChange={(e) => setForm({ ...form, isControlled: e.target.checked })} />
                      <ShieldAlert size={16} color="#DC2626" />
                      <span style={{ fontWeight: 600 }}>{_t('دواء محكوم (Controlled)', 'Controlled Substance')}</span>
                    </label>
                    {form.isControlled && (
                      <small style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                        <AlertTriangle size={11} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                        {_t('سيتطلب توقيع طبيب + تتبع كل صرف', 'Requires doctor signature + dispensing tracking')}
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>{_t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? _t('جاري الحفظ...', 'Saving...') : _t('حفظ', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.pm-spin { animation: pm-spin 1s linear infinite; } @keyframes pm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="card" style={{ padding: '16px' }} aria-busy="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: '40px', background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', marginBottom: '8px' }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
