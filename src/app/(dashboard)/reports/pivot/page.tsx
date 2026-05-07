'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function PivotPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ model: 'salesInvoice', rowField: 'customerId', colField: 'createdAt', valueField: 'total', aggregation: 'sum' });

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/pivot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      setResult(await res.json());
    } catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '📊 جدول محوري' : '📊 Pivot Table'}</h1>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'مصدر البيانات' : 'Data Source'}</label>
            <select value={config.model} onChange={e => setConfig({ ...config, model: e.target.value })} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}>
              <option value="salesInvoice">{isAr ? 'فواتير المبيعات' : 'Sales Invoices'}</option>
              <option value="purchaseInvoice">{isAr ? 'فواتير المشتريات' : 'Purchase Invoices'}</option>
              <option value="product">{isAr ? 'المنتجات' : 'Products'}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الصفوف' : 'Rows'}</label>
            <input value={config.rowField} onChange={e => setConfig({ ...config, rowField: e.target.value })} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الأعمدة' : 'Columns'}</label>
            <input value={config.colField} onChange={e => setConfig({ ...config, colField: e.target.value })} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'القيمة' : 'Value'}</label>
            <input value={config.valueField} onChange={e => setConfig({ ...config, valueField: e.target.value })} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', width: 100 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'التجميع' : 'Aggregation'}</label>
            <select value={config.aggregation} onChange={e => setConfig({ ...config, aggregation: e.target.value })} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}>
              <option value="sum">{isAr ? 'مجموع' : 'Sum'}</option>
              <option value="count">{isAr ? 'عدد' : 'Count'}</option>
              <option value="avg">{isAr ? 'متوسط' : 'Average'}</option>
            </select>
          </div>
          <button onClick={generate} disabled={loading} style={{ padding: '8px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {loading ? '...' : isAr ? '🔄 توليد' : '🔄 Generate'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 10, textAlign: isAr ? 'right' : 'left', position: 'sticky', left: 0, background: '#f5f5f5' }}>{isAr ? 'التصنيف' : 'Label'}</th>
              {(result.columns || []).map((c: string) => <th key={c} style={{ padding: 10, textAlign: 'center' }}>{c}</th>)}
              <th style={{ padding: 10, textAlign: 'center', fontWeight: 700, background: '#E3F2FD' }}>{isAr ? 'الإجمالي' : 'Total'}</th>
            </tr></thead>
            <tbody>
              {(result.rows || []).map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 10, fontWeight: 600, position: 'sticky', left: 0, background: '#fff' }}>{r._label}</td>
                  {(result.columns || []).map((c: string) => <td key={c} style={{ padding: 10, textAlign: 'center' }}>{(r[c] || 0).toLocaleString()}</td>)}
                  <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, background: '#E3F2FD' }}>{(r._total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            {result.totals && (
              <tfoot><tr style={{ background: '#f8f9fa', fontWeight: 700 }}>
                <td style={{ padding: 10 }}>{isAr ? 'الإجمالي' : 'Total'}</td>
                {(result.columns || []).map((c: string) => <td key={c} style={{ padding: 10, textAlign: 'center' }}>{(result.totals[c] || 0).toLocaleString()}</td>)}
                <td style={{ padding: 10, textAlign: 'center', color: '#2196F3' }}>{(result.totals._total || 0).toLocaleString()}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
