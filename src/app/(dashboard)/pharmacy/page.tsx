'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Pharmacy Hub — `/pharmacy`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  لوحة قيادة الصيدلية: ملخص أدوية + وصفات + اكتشاف تفاعلات الأدوية.
 *  للإدارة الكاملة → /pharmacy/manager
 *
 *  Endpoints:
 *   GET  /api/pharmacy/drugs              → قائمة الأدوية
 *   GET  /api/pharmacy/prescriptions     → الوصفات
 *   POST /api/pharmacy/drug-interactions → فحص تفاعلات
 *
 *  Permission: admin / pharmacist / pharmacy_manager
 *
 *  @see src/app/api/pharmacy/drugs/route.ts
 *  @see src/app/api/pharmacy/prescriptions/route.ts
 *  @see src/app/api/pharmacy/drug-interactions/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Pill, FileText, AlertTriangle, RefreshCw, Search, Plus, XCircle,
  ShieldAlert, Activity, Package, ExternalLink, CheckCircle2,
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
}

interface Prescription {
  id: number;
  patientName?: string;
  patientId?: number;
  doctorName?: string;
  date: string;
  status: string;
  totalItems?: number;
  total?: number | string;
}

interface InteractionResult {
  hasInteraction: boolean;
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  warnings: string[];
  recommendations?: string[];
}

const SEVERITY_META: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  LOW:      { color: '#16A34A', bg: '#DCFCE7', ar: 'منخفض',  en: 'Low' },
  MODERATE: { color: '#D97706', bg: '#FEF3C7', ar: 'متوسط',  en: 'Moderate' },
  HIGH:     { color: '#DC2626', bg: '#FEE2E2', ar: 'عالي',   en: 'High' },
  CRITICAL: { color: '#7F1D1D', bg: '#FCA5A5', ar: 'حرج',    en: 'Critical' },
};

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function fmtSAR(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency', currency: 'SAR', maximumFractionDigits: 2,
  }).format(n);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PharmacyPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Drug interaction checker
  const [drugIds, setDrugIds] = useState<string[]>(['', '']);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [checkingInteraction, setCheckingInteraction] = useState(false);

  const fetchOverview = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const [drugsRes, rxRes] = await Promise.all([
        fetch('/api/pharmacy/drugs', { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/pharmacy/prescriptions', { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } }),
      ]);
      if (drugsRes.status === 401 || rxRes.status === 401) {
        setLoadError(_t('انتهت الجلسة', 'Session expired'));
        return;
      }
      if (drugsRes.status === 403 || rxRes.status === 403) {
        setLoadError(_t('لا تملك صلاحية الوصول', 'No permission'));
        return;
      }

      if (drugsRes.ok) {
        const drugsData = await drugsRes.json();
        const list = Array.isArray(drugsData) ? drugsData : (drugsData.items ?? drugsData.drugs ?? []);
        setDrugs(list);
      }
      if (rxRes.ok) {
        const rxData = await rxRes.json();
        const list = Array.isArray(rxData) ? rxData : (rxData.items ?? rxData.prescriptions ?? []);
        setPrescriptions(list);
      }
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchOverview(); }, [fetchOverview]);

  const handleCheckInteraction = async () => {
    const ids = drugIds.map((s) => parseInt(s, 10)).filter((n) => n > 0);
    if (ids.length < 2) {
      toastError(_t('أدخل معرّفين على الأقل', 'Enter at least 2 drug IDs'));
      return;
    }
    setCheckingInteraction(true);
    setInteractionResult(null);
    try {
      const res = await fetch('/api/pharmacy/drug-interactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugIds: ids }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as InteractionResult;
      setInteractionResult(data);
      if (data.hasInteraction) {
        toastError(_t('⚠️ تفاعل دوائي مكتشف!', '⚠️ Drug interaction detected!'));
      } else {
        toastSuccess(_t('✓ لا توجد تفاعلات معروفة', '✓ No known interactions'));
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCheckingInteraction(false);
    }
  };

  const addDrugIdField = () => setDrugIds([...drugIds, '']);
  const updateDrugId = (idx: number, value: string) => {
    const next = [...drugIds];
    next[idx] = value;
    setDrugIds(next);
  };

  // Stats
  const stats = {
    totalDrugs: drugs.length,
    controlledDrugs: drugs.filter((d) => d.isControlled).length,
    expiringSoon: drugs.filter((d) => {
      if (!d.expiryDate) return false;
      const days = (new Date(d.expiryDate).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 90;
    }).length,
    activeRx: prescriptions.filter((p) => p.status === 'ACTIVE' || p.status === 'PENDING').length,
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pill size={28} color="#16A34A" />
            {_t('الصيدلية', 'Pharmacy')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'لوحة قيادة الصيدلية — أدوية، وصفات، فحص تفاعلات',
              'Pharmacy dashboard — drugs, prescriptions, interaction check',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/pharmacy/manager" className="btn btn-ghost">
            <Package size={16} /> {_t('إدارة الصيدلية', 'Pharmacy Manager')}
          </a>
          <a href="/drug-interact" className="btn btn-ghost">
            <ShieldAlert size={16} /> {_t('فاحص التفاعلات', 'Interaction Checker')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchOverview()}>
            <RefreshCw size={18} className={loading ? 'ph-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !loadError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <StatCard icon={<Pill size={20} color="#16A34A" />} label={_t('إجمالي الأدوية', 'Total Drugs')} value={String(stats.totalDrugs)} bg="#DCFCE7" />
          <StatCard icon={<ShieldAlert size={20} color="#DC2626" />} label={_t('أدوية محكومة', 'Controlled')} value={String(stats.controlledDrugs)} bg="#FEE2E2" />
          <StatCard icon={<AlertTriangle size={20} color="#D97706" />} label={_t('قاربت الصلاحية', 'Expiring Soon')} value={String(stats.expiringSoon)} bg="#FEF3C7" />
          <StatCard icon={<FileText size={20} color="#2563EB" />} label={_t('وصفات نشطة', 'Active Rx')} value={String(stats.activeRx)} bg="#EFF6FF" />
        </div>
      )}

      {loadError && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#DC2626', border: '1px dashed #FCA5A5', background: '#FEF2F2' }} role="alert">
          <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 600, marginBottom: '16px' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchOverview()}>
            <RefreshCw size={16} style={{ marginInlineEnd: '6px' }} /> {_t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}

      {/* Drug Interaction Checker */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={16} color="#DC2626" />
          {_t('فاحص تفاعلات الأدوية', 'Drug Interaction Checker')}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {_t(
            'أدخل معرّفات أدوية (2 أو أكثر) للتحقق من التفاعلات السلبية المعروفة',
            'Enter 2+ drug IDs to check for known adverse interactions',
          )}
        </p>
        {drugIds.map((id, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}.</span>
            <input
              type="number"
              min={1}
              className="input"
              placeholder={_t('معرّف الدواء', 'Drug ID')}
              value={id}
              onChange={(e) => updateDrugId(idx, e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addDrugIdField}>
            <Plus size={14} /> {_t('دواء آخر', 'Add Drug')}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCheckInteraction} disabled={checkingInteraction}>
            <Search size={14} /> {checkingInteraction ? _t('جاري الفحص...', 'Checking...') : _t('فحص التفاعلات', 'Check Interactions')}
          </button>
        </div>

        {interactionResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: interactionResult.hasInteraction ? (interactionResult.severity === 'CRITICAL' || interactionResult.severity === 'HIGH' ? '#FEE2E2' : '#FEF3C7') : '#DCFCE7',
              border: `2px solid ${interactionResult.hasInteraction ? (interactionResult.severity === 'CRITICAL' || interactionResult.severity === 'HIGH' ? '#DC2626' : '#D97706') : '#16A34A'}`,
              borderRadius: '8px',
            }}
            role="alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {interactionResult.hasInteraction ? <AlertTriangle size={20} color={SEVERITY_META[interactionResult.severity || 'MODERATE']?.color || '#D97706'} /> : <CheckCircle2 size={20} color="#16A34A" />}
              <strong style={{ fontSize: '14px' }}>
                {interactionResult.hasInteraction
                  ? _t(`⚠️ تفاعل مكتشف (${interactionResult.severity ? _t(SEVERITY_META[interactionResult.severity]?.ar, SEVERITY_META[interactionResult.severity]?.en) : ''})`, `⚠️ Interaction detected (${interactionResult.severity})`)
                  : _t('✓ لا توجد تفاعلات معروفة', '✓ No known interactions')}
              </strong>
            </div>
            {interactionResult.warnings.length > 0 && (
              <ul style={{ margin: '4px 0', paddingInlineStart: '20px', fontSize: '12px' }}>
                {interactionResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {interactionResult.recommendations && interactionResult.recommendations.length > 0 && (
              <>
                <h5 style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', marginBottom: '4px' }}>{_t('التوصيات:', 'Recommendations:')}</h5>
                <ul style={{ margin: '4px 0', paddingInlineStart: '20px', fontSize: '12px' }}>
                  {interactionResult.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* Recent Drugs */}
      {!loadError && drugs.length > 0 && (
        <div className="card" style={{ overflow: 'auto', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              {_t(`عينة الأدوية (${drugs.slice(0, 10).length} من ${drugs.length})`, `Drugs Sample (${drugs.slice(0, 10).length} of ${drugs.length})`)}
            </h3>
          </div>
          <table className="table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>{_t('الاسم', 'Name')}</th>
                <th>{_t('الاسم العلمي', 'Generic')}</th>
                <th>{_t('الشكل', 'Form')}</th>
                <th>{_t('التركيز', 'Strength')}</th>
                <th>{_t('السعر', 'Price')}</th>
                <th>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {drugs.slice(0, 10).map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>#{d.id}</td>
                  <td>{d.name}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.genericName || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{d.dosageForm || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{d.strength || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{d.price ? fmtSAR(toNum(d.price), lang) : '—'}</td>
                  <td>
                    {d.isControlled && (
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>
                        {_t('محكوم', 'Controlled')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Prescriptions */}
      {!loadError && prescriptions.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              {_t(`الوصفات الأخيرة (${prescriptions.slice(0, 10).length})`, `Recent Prescriptions (${prescriptions.slice(0, 10).length})`)}
            </h3>
          </div>
          <table className="table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>{_t('المريض', 'Patient')}</th>
                <th>{_t('الطبيب', 'Doctor')}</th>
                <th>{_t('التاريخ', 'Date')}</th>
                <th>{_t('البنود', 'Items')}</th>
                <th>{_t('الإجمالي', 'Total')}</th>
                <th>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>#{p.id}</td>
                  <td>{p.patientName || `#${p.patientId}`}</td>
                  <td style={{ fontSize: '12px' }}>{p.doctorName || '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(p.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td>{p.totalItems ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.total ? fmtSAR(toNum(p.total), lang) : '—'}</td>
                  <td style={{ fontSize: '12px' }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`.ph-spin { animation: ph-spin 1s linear infinite; } @keyframes ph-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: bg }}>
      {icon}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}
