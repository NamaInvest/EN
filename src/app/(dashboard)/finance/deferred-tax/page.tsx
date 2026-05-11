'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Shield, RefreshCw, Calculator, TrendingUp, TrendingDown, Info, DollarSign, Activity } from 'lucide-react';

interface DeferredTaxItem {
  id: string;
  itemName: string;
  carryingAmount: number;
  taxBase: number;
  temporaryDifference: number;
  taxRate: number;
  deferredTaxAmount: number;
  type: 'DTA' | 'DTL' | 'NONE';
}

interface DeferredTaxData {
  asOfDate: string;
  items: DeferredTaxItem[];
  summary: {
    totalDTA: number;
    totalDTL: number;
    netDeferredTax: number;
  };
}

export default function DeferredTaxPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState<number>(20); // Percentage
  const [data, setData] = useState<DeferredTaxData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDeferredTax = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/deferred-tax?date=${asOfDate}&rate=${taxRate / 100}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch Deferred Tax Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching Deferred Tax data');
    } finally {
      setLoading(false);
    }
  }, [asOfDate, taxRate]);

  useEffect(() => {
    fetchDeferredTax();
  }, [fetchDeferredTax]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(num);
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <Calculator size={32} color="#8B5CF6" />
            {_t('الضرائب المؤجلة (IAS 12)', 'Deferred Tax (IAS 12)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px', lineHeight: '1.6' }}>
            {_t(
              'محرك احتساب الضرائب المؤجلة بناءً على الفروقات المؤقتة بين القيمة الدفترية المحاسبية والوعاء الضريبي وفقاً لمعيار المحاسبة الدولي رقم 12.',
              'Deferred Tax calculation engine based on temporary differences between accounting carrying amounts and tax bases in accordance with IAS 12.'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('حتى تاريخ', 'As of Date')}</label>
            <input 
              type="date" 
              className="input" 
              value={asOfDate} 
              onChange={e => setAsOfDate(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('نسبة الضريبة (%)', 'Tax Rate (%)')}</label>
            <input 
              type="number" 
              className="input" 
              value={taxRate} 
              onChange={e => setTaxRate(Number(e.target.value))}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text)', width: '100px' }}
            />
          </div>
          
          <button onClick={fetchDeferredTax} style={{ marginTop: '20px', padding: '10px', background: '#8B5CF6', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('احتساب', 'Calculate')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #22C55E', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('أصول ضريبية مؤجلة (DTA)', 'Deferred Tax Assets (DTA)')}</div>
              <TrendingUp size={24} color="#22C55E" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#22C55E', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalDTA)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('فروقات مؤقتة قابلة للاقتطاع مستقبلاً', 'Deductible temporary differences')}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #EF4444', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('التزامات ضريبية مؤجلة (DTL)', 'Deferred Tax Liabilities (DTL)')}</div>
              <TrendingDown size={24} color="#EF4444" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#EF4444', fontFamily: 'monospace' }}>
              {formatCurrency(data.summary.totalDTL)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {_t('فروقات مؤقتة خاضعة للضريبة مستقبلاً', 'Taxable temporary differences')}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }}>{_t('الصافي الضريبي المؤجل', 'Net Deferred Tax')}</div>
              <Activity size={24} color="white" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'monospace' }}>
              {formatCurrency(Math.abs(data.summary.netDeferredTax))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
              {data.summary.netDeferredTax >= 0 ? _t('صافي أصل (Net DTA)', 'Net Asset (Net DTA)') : _t('صافي التزام (Net DTL)', 'Net Liability (Net DTL)')}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} color="#8B5CF6" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('سجل الفروقات المؤقتة', 'Temporary Differences Log')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('البند', 'Item')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('القيمة الدفترية', 'Carrying Amount')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الوعاء الضريبي', 'Tax Base')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('الفرق المؤقت', 'Temp. Diff')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('مبلغ الضريبة', 'Deferred Tax')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('النوع', 'Type')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري حساب الفروقات الضريبية...', 'Calculating tax differences...')}</div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Info size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد فروقات مؤقتة قابلة للاحتساب', 'No temporary differences found')}</div>
                  </td>
                </tr>
              ) : (
                data?.items.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                      {row.itemName}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>ID: {row.id}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {formatCurrency(row.carryingAmount)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {formatCurrency(row.taxBase)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '700', color: row.temporaryDifference < 0 ? '#22C55E' : (row.temporaryDifference > 0 ? '#EF4444' : 'var(--text)') }}>
                      {formatCurrency(row.temporaryDifference)}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '800' }}>
                      {formatCurrency(row.deferredTaxAmount)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {row.type === 'DTA' && <span style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800' }}>DTA (أصل)</span>}
                      {row.type === 'DTL' && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800' }}>DTL (التزام)</span>}
                      {row.type === 'NONE' && <span style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>N/A</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
