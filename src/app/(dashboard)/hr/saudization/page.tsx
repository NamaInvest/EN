'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Saudization Dashboard — `/hr/saudization`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  نظام السعودة (نطاقات) = نظام وزارة الموارد البشرية لتشجيع توظيف السعوديين.
 *  يحدد للمنشأة نطاقاً (Platinum/Green/Yellow/Red) حسب نسبة السعوديين.
 *  المنشآت في "النطاق الأحمر" تُحرم من الخدمات الحكومية + غرامات + منع توظيف وافدين.
 *
 *  الميزات:
 *   1. النطاق الحالي (Band Hero) — قراءة فورية مع color coding
 *   2. نسبة السعودة الحالية + Stats (Saudis/Expats/Total)
 *   3. SVG Trend Chart — تاريخ آخر 12 snapshot
 *   4. جدول تاريخي للـ snapshots
 *   5. زر إعادة حساب snapshot
 *   6. رابط للمحاكي (Nitaqat Simulator)
 *
 *  Permission: admin / owner / hr_officer / compliance_officer
 *
 *  @see src/app/api/saudi/saudization/snapshot/route.ts
 *  @see src/lib/qiwa-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  RefreshCcw,
  TrendingUp,
  Award,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Activity,
  Calculator,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type NitaqatBand = 'PLATINUM' | 'GREEN' | 'YELLOW' | 'RED' | string;

interface Snapshot {
  id?: number;
  totalEmployees?: number;
  saudiCount?: number;
  expatCount?: number;
  saudizationPct?: number;
  band?: NitaqatBand;
  activityCode?: string;
  takenAt?: string;
  createdAt?: string;
  [key: string]: any;
}

interface SnapshotResponse {
  latest: Snapshot | null;
  history: Snapshot[];
}

const BAND_META: Record<string, { color: string; bg: string; ar: string; en: string; icon: React.ComponentType<any> }> = {
  PLATINUM: { color: '#7C3AED', bg: '#F3E8FF', ar: 'بلاتيني', en: 'Platinum', icon: Award },
  GREEN:    { color: '#16A34A', bg: '#DCFCE7', ar: 'أخضر',   en: 'Green',    icon: TrendingUp },
  YELLOW:   { color: '#D97706', bg: '#FEF3C7', ar: 'أصفر',   en: 'Yellow',   icon: AlertTriangle },
  RED:      { color: '#DC2626', bg: '#FEE2E2', ar: 'أحمر',   en: 'Red',      icon: XCircle },
};

/** يحوّل نسبة من 0-1 أو 0-100 إلى نسبة بـ % ready-to-display */
function normalizePct(v: number | undefined): number {
  if (typeof v !== 'number') return 0;
  if (v > 1) return v;
  return v * 100;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function SaudizationPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string): string => (lang === 'ar' ? ar : en);

  const [data, setData] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/saudi/saudization/snapshot', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('لا تملك صلاحية الوصول', 'No permission')); return; }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const result = (await res.json()) as SnapshotResponse;
      setData(result);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleRecompute = async () => {
    if (!confirm(_t(
      'سيتم إعادة حساب نسبة السعودة + أخذ snapshot جديد. متابعة؟',
      'Will recompute Saudization % + take new snapshot. Continue?',
    ))) return;

    setRecomputing(true);
    try {
      const res = await fetch('/api/saudi/saudization/snapshot', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityCode: 'DEFAULT' }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم إعادة الحساب', 'Recomputed'));
      await fetchData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setRecomputing(false);
    }
  };

  // Computed values
  const latest = data?.latest;
  const latestPct = normalizePct(latest?.saudizationPct);
  const bandKey = (latest?.band || 'YELLOW').toUpperCase();
  const bandMeta = BAND_META[bandKey] || BAND_META.YELLOW;
  const BandIcon = bandMeta.icon;
  const history = (data?.history || []).slice().reverse(); // chronological

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#0F766E" />
            {_t('السعودة (نطاقات)', 'Saudization (Nitaqat)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'متابعة نسبة السعودة + النطاق الحالي للمنشأة + تاريخ التطور',
              'Track Saudization % + current Nitaqat band + historical trend',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="https://www.qiwa.sa/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <ExternalLink size={16} /> {_t('بوابة قوى', 'Qiwa Portal')}
          </a>
          <a href="/hr/nitaqat-simulator" className="btn btn-ghost">
            <Calculator size={16} /> {_t('محاكي النطاق', 'Nitaqat Simulator')}
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchData()} aria-label={_t('تحديث', 'Refresh')}>
            <RefreshCw size={18} className={loading ? 'sd-spin' : ''} />
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRecompute} disabled={recomputing}>
            <RefreshCcw size={18} className={recomputing ? 'sd-spin' : ''} /> {recomputing ? _t('جاري...', 'Recomputing...') : _t('إعادة الحساب', 'Recompute')}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <DashboardSkeleton />}
      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => void fetchData()} retryLabel={_t('إعادة المحاولة', 'Retry')} />
      )}

      {!loading && !loadError && data && !latest && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Users size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('لا توجد snapshot بعد', 'No snapshot yet')}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {_t(
              'اضغط "إعادة الحساب" لأخذ snapshot أولى للنسبة الحالية.',
              'Click "Recompute" to take the first snapshot.',
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRecompute} disabled={recomputing}>
            <RefreshCcw size={16} style={{ marginInlineEnd: '6px' }} />
            {_t('بدء الحساب', 'Start Compute')}
          </button>
        </div>
      )}

      {!loading && !loadError && latest && (
        <>
          {/* Band Hero */}
          <div
            className="card"
            style={{
              padding: '24px',
              background: bandMeta.bg,
              borderInlineStart: `8px solid ${bandMeta.color}`,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: bandMeta.color, fontWeight: 600, marginBottom: '4px' }}>
                {_t('النطاق الحالي', 'Current Nitaqat Band')}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: bandMeta.color, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BandIcon size={36} />
                {_t(bandMeta.ar, bandMeta.en)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px' }}>
                {bandKey === 'RED' && _t(
                  '⚠️ النطاق الأحمر — منع توظيف وافدين + تعليق خدمات حكومية + غرامات',
                  '⚠️ Red band — expat hiring blocked + gov services suspended + fines',
                )}
                {bandKey === 'YELLOW' && _t(
                  '⚠️ النطاق الأصفر — قيود على التوظيف الجديد',
                  '⚠️ Yellow band — restrictions on new hiring',
                )}
                {bandKey === 'GREEN' && _t(
                  '✓ النطاق الأخضر — معظم الامتيازات متاحة',
                  '✓ Green band — most privileges available',
                )}
                {bandKey === 'PLATINUM' && _t(
                  '✓ النطاق البلاتيني — كل الامتيازات + أولوية في تجديد التأشيرات',
                  '✓ Platinum band — full privileges + visa renewal priority',
                )}
              </div>
            </div>
            <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {_t('نسبة السعودة', 'Saudization %')}
              </div>
              <div style={{ fontSize: '64px', fontWeight: 800, color: bandMeta.color, lineHeight: 1 }}>
                {latestPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <StatCard icon={<Users size={20} color="#2563EB" />} label={_t('الإجمالي', 'Total')} value={String(latest.totalEmployees ?? 0)} bg="#EFF6FF" />
            <StatCard icon={<Users size={20} color="#16A34A" />} label={_t('سعوديون', 'Saudis')} value={String(latest.saudiCount ?? 0)} bg="#DCFCE7" />
            <StatCard icon={<Users size={20} color="#D97706" />} label={_t('وافدون', 'Expats')} value={String(latest.expatCount ?? 0)} bg="#FEF3C7" />
            <StatCard icon={<Activity size={20} color="#7C3AED" />} label="Activity Code" value={String(latest.activityCode || 'DEFAULT')} bg="#F3E8FF" />
          </div>

          {(latest.takenAt || latest.createdAt) && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {_t('آخر snapshot:', 'Last snapshot:')} {new Date(latest.takenAt || latest.createdAt || '').toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          )}

          {/* Trend Chart */}
          {history.length > 1 && (
            <div className="card" style={{ padding: '20px', marginBottom: '24px', overflow: 'auto' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                {_t(`تاريخ النسبة (${history.length} نقطة)`, `Historical % (${history.length} points)`)}
              </h3>
              <SaudizationTrendChart history={history} lang={lang} />
            </div>
          )}

          {/* History Table */}
          {history.length > 0 && (
            <div className="card" style={{ overflow: 'auto' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
                  {_t('سجل Snapshots', 'Snapshots History')}
                </h3>
              </div>
              <table className="table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{_t('التاريخ', 'Date')}</th>
                    <th>{_t('النسبة', '%')}</th>
                    <th>{_t('النطاق', 'Band')}</th>
                    <th>{_t('الإجمالي', 'Total')}</th>
                    <th>{_t('سعوديون', 'Saudis')}</th>
                    <th>{_t('وافدون', 'Expats')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((s, idx) => {
                    const pct = normalizePct(s.saudizationPct);
                    const bk = (s.band || 'YELLOW').toUpperCase();
                    const bm = BAND_META[bk] || BAND_META.YELLOW;
                    return (
                      <tr key={s.id ?? idx}>
                        <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(s.takenAt || s.createdAt || '').toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: bm.color }}>
                          {pct.toFixed(1)}%
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: bm.bg,
                            color: bm.color,
                          }}>
                            {_t(bm.ar, bm.en)}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px' }}>{s.totalEmployees ?? 0}</td>
                        <td style={{ fontSize: '12px' }}>{s.saudiCount ?? 0}</td>
                        <td style={{ fontSize: '12px' }}>{s.expatCount ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style>{`.sd-spin { animation: sd-spin 1s linear infinite; } @keyframes sd-spin { to { transform: rotate(360deg); } }`}</style>
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

/** SVG trend chart بدون مكتبة خارجية */
function SaudizationTrendChart({ history, lang }: { history: Snapshot[]; lang: string }) {
  if (history.length === 0) return null;
  const vals = history.map((s) => normalizePct(s.saudizationPct));
  const max = Math.max(...vals, 50);
  const min = Math.min(...vals, 0);
  const range = Math.max(1, max - min);

  const width = Math.max(600, history.length * 60);
  const height = 180;
  const padding = 30;

  const points = vals.map((v, i) => {
    const x = padding + (i / Math.max(1, vals.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y, v, snap: history[i] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <svg width={width} height={height + 40} style={{ overflow: 'visible' }} role="img" aria-label="Saudization trend">
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = height - padding - ((pct - min) / range) * (height - padding * 2);
        if (y < 0 || y > height) return null;
        return (
          <g key={pct}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="2 2" />
            <text x={padding - 4} y={y + 3} fontSize={9} textAnchor="end" fill="var(--text-muted)">{pct}%</text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#0F766E" strokeWidth={2} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#0F766E">
            <title>{`${p.snap.takenAt || p.snap.createdAt || ''}: ${p.v.toFixed(1)}%`}</title>
          </circle>
          <text x={p.x} y={p.y - 8} fontSize={9} textAnchor="middle" fill="#0F766E" fontWeight={600}>
            {p.v.toFixed(0)}%
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={`l${i}`} x={p.x} y={height + 14} fontSize={9} textAnchor="middle" fill="var(--text-muted)">
          {new Date(p.snap.takenAt || p.snap.createdAt || '').toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      {[...Array(3)].map((_, i) => (
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
