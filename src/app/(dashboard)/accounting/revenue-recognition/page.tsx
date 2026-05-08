'use client';
import { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function RevenueRecognitionDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ unearned: 0, recognized: 0, contracts: 0, exceptions: 0 });
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/accounting/revenue-recognition', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          if (d.stats) setStats(d.stats);
          setLines(d.lines || d.data || d || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const cards = [
    { l: _t('إيرادات غير مكتسبة', 'Unearned Revenue'), v: `${fmt(stats.unearned)} ${_t('ر.س', 'SAR')}`, s: _t('إجمالي الالتزام المؤجل', 'Total deferred liability'), c: '#6366F1', ic: AlertCircle },
    { l: _t('معترف بها (هذا الشهر)', 'Recognized (This Month)'), v: `${fmt(stats.recognized)} ${_t('ر.س', 'SAR')}`, s: _t('تم ترحيلها لدفتر الأستاذ', 'Posted to GL'), c: '#22C55E', ic: TrendingUp },
    { l: _t('عقود نشطة', 'Active Contracts'), v: stats.contracts, s: _t('تحت الإطفاء', 'Under amortization'), c: '#3B82F6', ic: Target },
    { l: _t('استثناءات', 'Exceptions'), v: stats.exceptions, s: _t('تتطلب مراجعة', 'Requires review'), c: '#EF4444', ic: Calendar },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={28} color="var(--primary)" /> {_t('الاعتراف بالإيراد (IFRS 15)', 'Revenue Recognition (IFRS 15)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('تتبع التزامات الأداء وإطفاء الإيرادات المؤجلة', 'Automated performance obligation tracking and deferred revenue amortization')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} /> {_t('توقعات', 'Forecast')}</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={16} /> {_t('تشغيل الإطفاء', 'Run Amortization')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: c.c === '#EF4444' && stats.exceptions > 0 ? '#EF4444' : undefined }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.s}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('جداول الإطفاء القادمة', 'Upcoming Amortization Schedules')}</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>{_t('جاري التحميل...', 'Loading...')}</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>{_t('رقم العقد', 'Contract #')}</th>
                <th>{_t('العميل', 'Customer')}</th>
                <th>{_t('نوع الجدول', 'Schedule Type')}</th>
                <th>{_t('تاريخ الاعتراف القادم', 'Next Recognition')}</th>
                <th>{_t('المبلغ', 'Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{_t('لا توجد جداول قادمة', 'No upcoming schedules')}</td></tr>
              ) : lines.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>{l.contractNumber || l.schedule?.performanceObligation?.contract?.contractNumber || '—'}</td>
                  <td>{l.customerName || l.schedule?.performanceObligation?.contract?.customer?.name || '—'}</td>
                  <td>{l.frequency || l.schedule?.frequency || '—'}</td>
                  <td>{l.recognitionDate?.slice?.(0, 10) || '—'}</td>
                  <td style={{ fontWeight: '600' }}>{Number(l.scheduledAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {_t('ر.س', 'SAR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
