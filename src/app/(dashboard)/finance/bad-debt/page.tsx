'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { AlertOctagon, RefreshCw, DollarSign, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

interface Invoice {
  invoiceId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  probabilityOfDefault: number;
  requiredProvision: number;
}

interface BadDebtData {
  asOfDate: string;
  totalReceivables: number;
  totalOverdue: number;
  totalProvisionRequired: number;
  invoices: Invoice[];
  summaryByAging: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '91-120': number;
    '120+': number;
  };
}

export default function BadDebtProvisionPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [data, setData] = useState<BadDebtData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBadDebtData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/bad-debt`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        alert(json.error || 'Failed to fetch Bad Debt Data');
      }
    } catch (err) {
      console.error(err);
      alert('Network error fetching Bad Debt data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadDebtData();
  }, [fetchBadDebtData]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--text)' }}>
            <AlertOctagon size={32} color="#EF4444" />
            {_t('مخصص الديون المشكوك في تحصيلها (IFRS 9)', 'Expected Credit Loss / Bad Debt Provision')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '700px', lineHeight: '1.6' }}>
            {_t(
              'محرك ذكي لاحتساب مخصص الخسائر الائتمانية المتوقعة (ECL) وفق معيار IFRS 9، معتمداً على مصفوفة أعمار الديون (Aging) ونسب احتمالية التعثر (PD).',
              'Smart engine calculating Expected Credit Loss (ECL) provision per IFRS 9, using aging matrices and Probability of Default (PD).'
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchBadDebtData} style={{ padding: '10px 16px', background: '#EF4444', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {_t('إعادة احتساب المخصص', 'Recalculate Provision')}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #3B82F6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي الذمم المدينة', 'Total Receivables (AR)')}</div>
              <DollarSign size={24} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#3B82F6', fontFamily: 'monospace' }}>
              {formatCurrency(data.totalReceivables)}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', borderLeft: '4px solid #F59E0B', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{_t('إجمالي الديون المتأخرة', 'Total Overdue')}</div>
              <Clock size={24} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
              {formatCurrency(data.totalOverdue)}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>{_t('المخصص المطلوب (ECL)', 'Required Provision (ECL)')}</div>
              <ShieldAlert size={24} color="white" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'monospace' }}>
              {formatCurrency(data.totalProvisionRequired)}
            </div>
          </div>

        </div>
      )}

      {/* Details Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingDown size={20} color="#EF4444" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{_t('تفصيل الفواتير ونسبة التعثر المتوقعة', 'Invoice Aging & Probability of Default')}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('العميل / الفاتورة', 'Customer / Invoice')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('قيمة الفاتورة', 'Amount')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('أيام التأخير', 'Days Overdue')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>{_t('احتمالية التعثر (PD)', 'Probability of Default')}</th>
                <th style={{ padding: '16px 20px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>{_t('قيمة المخصص (ECL)', 'ECL Provision')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '16px' }}>{_t('جاري احتساب المخصصات...', 'Calculating provisions...')}</div>
                  </td>
                </tr>
              ) : data?.invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertOctagon size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '16px' }}>{_t('لا توجد فواتير متأخرة', 'No overdue invoices')}</div>
                  </td>
                </tr>
              ) : (
                data?.invoices.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: row.probabilityOfDefault === 100 ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text)' }}>
                      {row.customerName}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{row.invoiceId} • {_t('الاستحقاق:', 'Due:')} {new Date(row.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: '600' }}>
                      {formatCurrency(row.amount)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {row.daysOverdue > 0 ? (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: row.daysOverdue > 90 ? '#EF4444' : (row.daysOverdue > 30 ? '#F59E0B' : '#10B981') }}>
                          {row.daysOverdue} {_t('أيام', 'Days')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: '4px' }}>{_t('غير متأخر', 'Not Overdue')}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 'bold', color: row.probabilityOfDefault > 50 ? '#EF4444' : 'var(--text)' }}>
                      {row.probabilityOfDefault}%
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'left', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'monospace', color: row.requiredProvision > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                        {formatCurrency(row.requiredProvision)}
                      </div>
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
