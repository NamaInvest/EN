'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function AgingReportPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [type, setType] = useState<'AR' | 'AP'>('AR');
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/aging?type=${type}`).then(r => r.json()).then(d => {
      setData(d.rows || []);
      setTotals(d.totals || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  const buckets = ['current', '30', '60', '90', '120plus'];
  const bucketLabels = isAr ? ['جاري', '1-30', '31-60', '61-90', '120+'] : ['Current', '1-30', '31-60', '61-90', '120+'];

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{isAr ? '📊 تقرير أعمار الديون' : '📊 Aging Report'}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setType('AR')} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: type === 'AR' ? '#2196F3' : '#e0e0e0', color: type === 'AR' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}>
          {isAr ? 'مدينون (AR)' : 'Receivables (AR)'}
        </button>
        <button onClick={() => setType('AP')} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: type === 'AP' ? '#FF9800' : '#e0e0e0', color: type === 'AP' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}>
          {isAr ? 'دائنون (AP)' : 'Payables (AP)'}
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 12, textAlign: isAr ? 'right' : 'left' }}>{isAr ? (type === 'AR' ? 'العميل' : 'المورد') : (type === 'AR' ? 'Customer' : 'Supplier')}</th>
            {bucketLabels.map(b => <th key={b} style={{ padding: 12, textAlign: 'center' }}>{b}</th>)}
            <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>{isAr ? 'الإجمالي' : 'Total'}</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : data.length > 0 ? data.map((row: any, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{row.name}</td>
                {buckets.map(b => (
                  <td key={b} style={{ padding: 12, textAlign: 'center', color: row[b] > 0 ? (b === '120plus' ? '#F44336' : b === '90' ? '#FF9800' : '#333') : '#ccc' }}>
                    {(row[b] || 0).toLocaleString()}
                  </td>
                ))}
                <td style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>{(row.total || 0).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد بيانات' : 'No data'}</td></tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot><tr style={{ background: '#f8f9fa', fontWeight: 700 }}>
              <td style={{ padding: 12 }}>{isAr ? 'الإجمالي' : 'Total'}</td>
              {buckets.map(b => <td key={b} style={{ padding: 12, textAlign: 'center' }}>{(totals[b] || 0).toLocaleString()}</td>)}
              <td style={{ padding: 12, textAlign: 'center', color: '#2196F3' }}>{(totals.total || 0).toLocaleString()}</td>
            </tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
