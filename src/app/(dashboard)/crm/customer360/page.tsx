'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function Customer360Page() {
  const { lang } = useTranslation();
  const isAr = lang === 'ar';
  const [customerId, setCustomerId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!customerId) return;
    setLoading(true);
    fetch(`/api/crm/customer360?id=${customerId}`).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  };

  const classColor: Record<string, string> = { A: '#4CAF50', B: '#FF9800', C: '#F44336' };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{isAr ? '👤 عرض شامل للعميل (360°)' : '👤 Customer 360°'}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder={isAr ? 'رقم العميل...' : 'Customer ID...'} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', width: 200 }} />
        <button onClick={load} disabled={loading} style={{ padding: '8px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{loading ? '...' : isAr ? 'عرض' : 'Load'}</button>
      </div>
      {data?.customer && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3>{data.customer.name}</h3>
              <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{data.customer.phone} | {data.customer.email || '—'}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ background: (classColor[data.classification] || '#999') + '20', color: classColor[data.classification], padding: '4px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
                  {isAr ? 'تصنيف' : 'Class'}: {data.classification}
                </span>
              </div>
            </div>
            {[
              { label: isAr ? 'إجمالي المبيعات' : 'Total Sales', value: data.summary?.totalSales, color: '#2196F3' },
              { label: isAr ? 'المدفوع' : 'Paid', value: data.summary?.totalPaid, color: '#4CAF50' },
              { label: isAr ? 'المستحق' : 'Balance', value: data.summary?.balance, color: '#F44336' },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 12, color: '#888' }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{(k.value || 0).toLocaleString()} SAR</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h4 style={{ marginBottom: 8 }}>{isAr ? '🧾 آخر الفواتير' : '🧾 Recent Invoices'}</h4>
              {(data.invoices || []).length > 0 ? data.invoices.map((inv: any) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <span>#{inv.invoiceNumber || inv.id}</span><span>{(inv.total || 0).toLocaleString()}</span>
                </div>
              )) : <div style={{ color: '#ccc', textAlign: 'center', padding: 20 }}>{isAr ? 'لا توجد' : 'None'}</div>}
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h4 style={{ marginBottom: 8 }}>{isAr ? '💳 المدفوعات' : '💳 Payments'}</h4>
              {(data.payments || []).length > 0 ? data.payments.map((pay: any) => (
                <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <span>{pay.method || '—'}</span><span style={{ color: '#4CAF50' }}>{(pay.amount || 0).toLocaleString()}</span>
                </div>
              )) : <div style={{ color: '#ccc', textAlign: 'center', padding: 20 }}>{isAr ? 'لا توجد' : 'None'}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
