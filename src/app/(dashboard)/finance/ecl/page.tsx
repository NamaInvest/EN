import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ECLCalculatorPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchECL = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/finance/ecl', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const result = await r.json();
      if (result.success) setData(result.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchECL(); }, []);

  const handlePostJE = async () => {
    if (!data?.portfolioECL) return;
    setLoading(true);
    try {
      const r = await fetch('/api/finance/ecl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ totalECL: data.portfolioECL.totalECL })
      });
      const result = await r.json();
      alert(r.ok ? result.message : result.error);
    } catch {} finally { setLoading(false); }
  };

  if (loading && !data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary)' }}>{_t('جاري حساب مخصصات الخسائر الائتمانية...', 'Calculating ECL provisions...')}</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>{_t('خطأ في جلب البيانات', 'Error fetching data')}</div>;

  const { portfolioECL, customerECLDetails, parameters } = data;
  const avgRate = portfolioECL.totalEAD > 0 ? (portfolioECL.totalECL / portfolioECL.totalEAD * 100) : 0;
  const fmt = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const cards = [
    { l: _t('إجمالي الانكشاف (EAD)', 'Total Exposure (EAD)'), v: `${fmt(portfolioECL.totalEAD)} ${_t('ر.س', 'SAR')}`, c: '#3B82F6' },
    { l: _t('إجمالي الخسارة المتوقعة (ECL)', 'Total Expected Loss (ECL)'), v: `${fmt(portfolioECL.totalECL)} ${_t('ر.س', 'SAR')}`, c: '#EF4444' },
    { l: _t('متوسط نسبة المخصص', 'Average Provision Rate'), v: `${avgRate.toFixed(2)}%`, c: '#F59E0B' },
  ];

  const buckets = [
    { k: '0-30', l: _t('0-30 يوم', '0-30 Days') },
    { k: '31-60', l: _t('31-60 يوم', '31-60 Days') },
    { k: '61-90', l: _t('61-90 يوم', '61-90 Days') },
    { k: '91-180', l: _t('91-180 يوم', '91-180 Days') },
    { k: '181-365', l: _t('181-365 يوم', '181-365 Days') },
    { k: '>365', l: _t('أكثر من سنة', '>365 Days') },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', padding: '20px', borderRadius: '8px', borderBottom: '4px solid #6366F1', background: 'var(--bg-card)' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>{_t('حاسبة الخسائر الائتمانية المتوقعة (IFRS 9 ECL)', 'Expected Credit Losses Calculator (IFRS 9 ECL)')}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>ECL = PD × LGD × EAD</p>
        </div>
        <button className="btn btn-primary" onClick={handlePostJE} disabled={loading || portfolioECL.totalECL === 0} style={{ fontWeight: '700' }}>
          {_t('إنشاء قيد المخصص (Post JE)', 'Post Provision JE')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}`, textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: c.c, marginTop: '8px' }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('ECL حسب أعمار الذمم', 'ECL by Aging Bucket')}</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{_t('الفئة', 'Bucket')}</th>
                <th>{_t('نسبة التعثر (PD)', 'PD Rate')}</th>
                <th>{_t('ECL', 'ECL')}</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map(b => (
                <tr key={b.k}>
                  <td style={{ fontWeight: '600' }}>{b.l}</td>
                  <td>{((parameters.PD_RATES[b.k] || 0) * 100).toFixed(1)}%</td>
                  <td style={{ fontWeight: '700', color: '#EF4444' }}>{fmt(portfolioECL[b.k] || 0)} {_t('ر.س', 'SAR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{_t('محددات النموذج', 'Model Parameters')}</h3>
          <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-secondary, #f8fafc)', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{_t('نسبة الخسارة (LGD)', 'LGD Rate')}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#3B82F6' }}>{(parameters.DEFAULT_LGD * 100).toFixed(0)}%</span>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>{_t('احتمالية التعثر (PD)', 'PD Rates')}</h4>
          {Object.entries(parameters.PD_RATES).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{k} {_t('يوم', 'days')}</span>
              <span style={{ fontFamily: 'monospace' }}>{((v as number) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('تفصيل ECL لكل عميل', 'ECL per Customer (Top Contributors)')}</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{_t('العميل', 'Customer')}</th>
              <th style={{ textAlign: 'center' }}>{_t('الرصيد', 'Balance')}</th>
              <th style={{ textAlign: 'center' }}>{_t('0-60 يوم', '0-60 Days')}</th>
              <th style={{ textAlign: 'center', color: '#F97316' }}>{_t('61-180 يوم', '61-180 Days')}</th>
              <th style={{ textAlign: 'center', color: '#EF4444' }}>{_t('>180 يوم', '>180 Days')}</th>
              <th style={{ textAlign: 'center', color: '#EF4444', fontWeight: '800' }}>{_t('مخصص ECL', 'ECL Provision')}</th>
            </tr>
          </thead>
          <tbody>
            {(customerECLDetails || []).slice(0, 50).map((c: any) => {
              const b1 = (c.aging?.['0-30'] || 0) + (c.aging?.['31-60'] || 0);
              const b2 = (c.aging?.['61-90'] || 0) + (c.aging?.['91-180'] || 0);
              const b3 = (c.aging?.['181-365'] || 0) + (c.aging?.['>365'] || 0);
              return (
                <tr key={c.customerId}>
                  <td style={{ fontWeight: '600' }}>{c.customerName}</td>
                  <td style={{ textAlign: 'center' }}>{fmt(c.balance)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{b1 > 0 ? fmt(b1) : '—'}</td>
                  <td style={{ textAlign: 'center', color: '#F97316', fontWeight: '500' }}>{b2 > 0 ? fmt(b2) : '—'}</td>
                  <td style={{ textAlign: 'center', color: '#EF4444', fontWeight: '700' }}>{b3 > 0 ? fmt(b3) : '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: '900', color: '#EF4444' }}>{fmt(c.totalCustomerECL)} {_t('ر.س', 'SAR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
