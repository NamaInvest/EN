'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, Download, BarChart, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface AgingBucket {
  entityId: number;
  entityName: string;
  totalRemaining: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  daysOver90: number;
}

interface AgingStats {
  type: 'AR' | 'AP';
  asOfDate: string;
  buckets: AgingBucket[];
  totals: {
    totalRemaining: number;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    daysOver90: number;
  };
}

export default function AgingReportPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [type, setType] = useState<'AR' | 'AP'>('AR');
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<AgingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgingData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/aging?type=${type}&date=${asOfDate}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to load aging data');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [type, asOfDate]);

  useEffect(() => {
    fetchAgingData();
  }, [fetchAgingData]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(num);
  };

  const getHeatmapColor = (value: number, type: 'AR' | 'AP') => {
    if (value <= 0) return 'transparent';
    // For AR: High values in old buckets are BAD (Red)
    // For AP: High values in old buckets are BAD (Red) to keep relations, but cashflow positive.
    // We will use standard heatmap: darker red for older buckets if value is high.
    return 'var(--destructive) 15'; // 15 opacity
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {type === 'AR' ? <TrendingUp size={28} color="#22C55E" /> : <TrendingDown size={28} color="#EF4444" />}
            {type === 'AR' ? _t('تقادم الذمم المدينة (AR Aging)', 'AR Aging Report') : _t('تقادم الذمم الدائنة (AP Aging)', 'AP Aging Report')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {_t('تحليل الديون المتأخرة والتدفقات النقدية', 'Late debt analysis and cash flows')}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="card" style={{ display: 'flex', padding: '4px', background: 'var(--bg-muted)', borderRadius: '8px' }}>
            <button 
              onClick={() => setType('AR')}
              style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', 
                       background: type === 'AR' ? 'var(--bg-card)' : 'transparent',
                       boxShadow: type === 'AR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {_t('العملاء (AR)', 'Customers (AR)')}
            </button>
            <button 
              onClick={() => setType('AP')}
              style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', 
                       background: type === 'AP' ? 'var(--bg-card)' : 'transparent',
                       boxShadow: type === 'AP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {_t('الموردين (AP)', 'Vendors (AP)')}
            </button>
          </div>
          
          <input 
            type="date" 
            className="input" 
            value={asOfDate} 
            onChange={e => setAsOfDate(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          />
          
          <button className="btn btn-primary" onClick={fetchAgingData} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {_t('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', borderTop: '3px solid #3B82F6' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{_t('الإجمالي المتبقي', 'Total Remaining')}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#3B82F6' }}>{formatCurrency(data.totals.totalRemaining)}</div>
          </div>
          <div className="card" style={{ padding: '16px', borderTop: '3px solid #22C55E' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{_t('جاري (لم يحن الاستحقاق)', 'Current')}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#22C55E' }}>{formatCurrency(data.totals.current)}</div>
          </div>
          <div className="card" style={{ padding: '16px', borderTop: '3px solid #F59E0B' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{_t('تأخير 1 - 30 يوم', '1 - 30 Days')}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B' }}>{formatCurrency(data.totals.days30)}</div>
          </div>
          <div className="card" style={{ padding: '16px', borderTop: '3px solid #EF4444' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{_t('تأخير فوق 90 يوم', 'Over 90 Days')}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#EF4444' }}>{formatCurrency(data.totals.daysOver90)}</div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card" style={{ overflow: 'auto', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)' }}>{type === 'AR' ? _t('العميل', 'Customer') : _t('المورد', 'Vendor')}</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)' }}>{_t('الإجمالي المتبقي', 'Total')}</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#22C55E' }}>{_t('جاري', 'Current')}</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#EAB308' }}>1 - 30</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#F97316' }}>31 - 60</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#EF4444' }}>61 - 90</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#991B1B' }}>+90</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  <div>{_t('جاري احتساب البيانات...', 'Calculating Data...')}</div>
                </td>
              </tr>
            ) : data?.buckets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Shield size={32} className="mx-auto mb-2 opacity-50" />
                  <div>{_t('لا توجد أرصدة مستحقة', 'No outstanding balances found')}</div>
                </td>
              </tr>
            ) : (
              data?.buckets.map((row) => (
                <tr key={row.entityId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text)' }}>
                    {row.entityName}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', fontFamily: 'monospace' }}>
                    {formatCurrency(row.totalRemaining)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: row.current > 0 ? '#22C55E' : 'var(--text-muted)' }}>
                    {formatCurrency(row.current)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', background: row.days30 > 0 ? '#FEF9C3' : 'transparent', color: row.days30 > 0 ? '#A16207' : 'var(--text-muted)' }}>
                    {formatCurrency(row.days30)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', background: row.days60 > 0 ? '#FFEDD5' : 'transparent', color: row.days60 > 0 ? '#C2410C' : 'var(--text-muted)' }}>
                    {formatCurrency(row.days60)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', background: row.days90 > 0 ? '#FEE2E2' : 'transparent', color: row.days90 > 0 ? '#B91C1C' : 'var(--text-muted)' }}>
                    {formatCurrency(row.days90)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: row.daysOver90 > 0 ? '700' : '400', background: row.daysOver90 > 0 ? '#FECACA' : 'transparent', color: row.daysOver90 > 0 ? '#7F1D1D' : 'var(--text-muted)' }}>
                    {formatCurrency(row.daysOver90)}
                  </td>
                </tr>
              ))
            )}
            
            {/* Totals Footer row */}
            {!loading && data && data.buckets.length > 0 && (
              <tr style={{ background: 'var(--bg-muted)', fontWeight: '800' }}>
                <td style={{ padding: '16px', textAlign: 'right' }}>{_t('الإجمالي العام', 'Grand Total')}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#3B82F6' }}>{formatCurrency(data.totals.totalRemaining)}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#22C55E' }}>{formatCurrency(data.totals.current)}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#EAB308' }}>{formatCurrency(data.totals.days30)}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#F97316' }}>{formatCurrency(data.totals.days60)}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#EF4444' }}>{formatCurrency(data.totals.days90)}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: '#991B1B' }}>{formatCurrency(data.totals.daysOver90)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
