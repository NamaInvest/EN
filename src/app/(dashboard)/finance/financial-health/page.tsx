'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

interface HealthKPI { label: string; labelAr: string; value: string | number; status: 'good'|'warn'|'bad'; benchmark?: string }
interface HealthData { score: number; rating: string; kpis: HealthKPI[]; recommendations: string[]; recommendationsAr: string[]; zScore?: number }

const STATUS_COLOR = { good: '#4CAF50', warn: '#FF9800', bad: '#F44336' };
const STATUS_BG    = { good: '#E8F5E9', warn: '#FFF3E0', bad: '#FFEBEE' };
const STATUS_ICON  = { good: '✅', warn: '⚠️', bad: '🔴' };

export default function FinancialHealthPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const [data, setData]       = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch('/api/finance/financial-health?tenantId=default');
      const d = await r.json();
      setData(d);
    } catch (e) { setMsg(String(e)); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const scoreColor = (s: number) => s >= 70 ? '#4CAF50' : s >= 50 ? '#FF9800' : '#F44336';
  const scoreBg    = (s: number) => s >= 70 ? '#E8F5E9' : s >= 50 ? '#FFF3E0' : '#FFEBEE';

  return (
    <div style={{ padding: 24, direction: dir, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{isAr ? '🏥 الصحة المالية' : '🏥 Financial Health'}</h1>
          <p style={{ color: '#666', fontSize: 13 }}>{isAr ? 'مؤشرات السيولة والملاءة والربحية + Altman Z-Score' : 'Liquidity, solvency, profitability + Altman Z-Score'}</p>
        </div>
        <button onClick={load} disabled={loading} style={{ padding: '8px 20px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {loading ? '...' : (isAr ? '🔄 تحديث' : '🔄 Refresh')}
        </button>
      </div>

      {msg && <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#C62828', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>❌ {msg}</div>}

      {loading && !data && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', background: '#fff', borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div>{isAr ? 'جاري تحميل البيانات...' : 'Loading financial data...'}</div>
        </div>
      )}

      {data && (
        <>
          {/* Overall Score */}
          <div style={{ background: scoreBg(data.score), border: `2px solid ${scoreColor(data.score)}`, borderRadius: 16, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(data.score) }}>{data.score}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{isAr ? 'من 100' : '/ 100'}</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(data.score), marginBottom: 4 }}>{data.rating}</div>
              {data.zScore !== undefined && (
                <div style={{ fontSize: 13, color: '#555' }}>
                  Altman Z-Score: <strong>{data.zScore.toFixed(2)}</strong>
                  <span style={{ marginInlineStart: 8, color: data.zScore > 2.99 ? '#4CAF50' : data.zScore > 1.81 ? '#FF9800' : '#F44336', fontSize: 12 }}>
                    {data.zScore > 2.99 ? (isAr ? '(منطقة آمنة)' : '(Safe Zone)') : data.zScore > 1.81 ? (isAr ? '(منطقة رمادية)' : '(Grey Zone)') : (isAr ? '(منطقة خطر)' : '(Distress Zone)')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {(data.kpis ?? []).map((kpi, i) => (
              <div key={i} style={{ background: STATUS_BG[kpi.status], border: `1px solid ${STATUS_COLOR[kpi.status]}40`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{isAr ? kpi.labelAr : kpi.label}</div>
                  <span>{STATUS_ICON[kpi.status]}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: STATUS_COLOR[kpi.status], margin: '6px 0 2px' }}>{kpi.value}</div>
                {kpi.benchmark && <div style={{ fontSize: 11, color: '#888' }}>{isAr ? 'المعيار:' : 'Benchmark:'} {kpi.benchmark}</div>}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {(data.recommendations ?? []).length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{isAr ? '💡 التوصيات' : '💡 Recommendations'}</h3>
              <ul style={{ paddingInlineStart: 20, margin: 0 }}>
                {(isAr ? data.recommendationsAr : data.recommendations).map((r, i) => (
                  <li key={i} style={{ padding: '4px 0', fontSize: 13, color: '#444' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
