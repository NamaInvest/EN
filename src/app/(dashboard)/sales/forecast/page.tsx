import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function SalesForecastPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { success: ts, error: te } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState('2026');
  const [loading, setLoading] = useState(true);
  const months = lang === 'ar' ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/sales/forecast?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (r.ok) { const j = await r.json(); setData(j.data || j || []); }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [period]);

  const totalWon = data.reduce((a, r) => a + (r.won || 0), 0);
  const totalPipeline = data.reduce((a, r) => a + (r.pipeline || 0), 0);
  const avgWinRate = data.length > 0 ? (data.reduce((a, r) => { const t = r.won + r.lost; return a + (t > 0 ? r.won / t : 0); }, 0) / data.length * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={28} color="var(--primary)" /> {_t('التوقعات وخط الأنابيب', 'Sales Forecast & Pipeline')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('تحليل أداء المبيعات الشهري', 'Monthly sales performance analysis')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input className="input" style={{ width: '100px' }} value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026" />
          <button className="btn btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={16} /> {_t('تحديث', 'Refresh')}</button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={16} /> {_t('تثبيت التوقع', 'Lock Forecast')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { l: _t('المكسب الفعلي', 'Won (Actual)'), v: `${totalWon.toLocaleString()} ${_t('ر.س', 'SAR')}`, c: '#22C55E' },
          { l: _t('خط الأنابيب', 'Pipeline'), v: `${totalPipeline.toLocaleString()} ${_t('ر.س', 'SAR')}`, c: '#3B82F6' },
          { l: _t('معدل الفوز', 'Win Rate'), v: `${avgWinRate}%`, c: '#6366F1' },
          { l: _t('الأشهر', 'Months'), v: data.length, c: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${s.c}` }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.l}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.c, marginTop: '8px' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{_t('تحليل شلال المبيعات', 'Pipeline Waterfall')} — {period}</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>{_t('الشهر', 'Month')}</th>
                <th style={{ color: '#22C55E' }}>{_t('مكسب (فعلي)', 'Won (Actual)')}</th>
                <th style={{ color: '#EF4444' }}>{_t('خسارة', 'Lost')}</th>
                <th style={{ color: '#3B82F6' }}>{_t('قيد التقدم', 'In Progress')}</th>
                <th style={{ fontWeight: '800' }}>{_t('إجمالي الأنبوب', 'Total Pipeline')}</th>
                <th>{_t('معدل الفوز', 'Win Rate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const t = row.won + row.lost;
                const wr = t > 0 ? ((row.won / t) * 100).toFixed(1) + '%' : 'N/A';
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{months[idx] || row.month}</td>
                    <td style={{ color: '#22C55E', fontWeight: '600' }}>{(row.won || 0).toLocaleString()}</td>
                    <td style={{ color: '#EF4444' }}>{(row.lost || 0).toLocaleString()}</td>
                    <td style={{ color: '#3B82F6' }}>{(row.inProgress || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: '800' }}>{(row.pipeline || 0).toLocaleString()}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: parseFloat(wr) > 50 ? '#22C55E20' : '#EF444420', color: parseFloat(wr) > 50 ? '#22C55E' : '#EF4444' }}>{wr}</span>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد بيانات', 'No data')}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
