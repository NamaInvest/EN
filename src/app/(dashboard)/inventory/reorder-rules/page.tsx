import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function ReorderRulesPage() {
  const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const isAr = lang === 'ar';
  const [rules, setRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tab, setTab] = useState<'rules' | 'alerts'>('alerts');

  useEffect(() => {
    fetch('/api/inventory/reorder-rules').then(r => r.json()).then(d => setRules(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/inventory/reorder-rules?view=alerts').then(r => r.json()).then(d => setAlerts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{isAr ? '📦 قواعد إعادة الطلب' : '📦 Reorder Rules'}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('alerts')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: tab === 'alerts' ? '#F44336' : '#e8e8e8', color: tab === 'alerts' ? '#fff' : '#555', cursor: 'pointer', fontWeight: 600 }}>
          ⚠️ {isAr ? 'تنبيهات' : 'Alerts'} ({alerts.length})
        </button>
        <button onClick={() => setTab('rules')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: tab === 'rules' ? '#2196F3' : '#e8e8e8', color: tab === 'rules' ? '#fff' : '#555', cursor: 'pointer', fontWeight: 600 }}>
          📋 {isAr ? 'القواعد' : 'Rules'} ({rules.length})
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {tab === 'alerts' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FFF3E0' }}>
              <th style={{ padding: 10 }}>{isAr ? 'المنتج' : 'Product'}</th>
              <th style={{ padding: 10 }}>{isAr ? 'الرصيد' : 'Current'}</th>
              <th style={{ padding: 10 }}>{isAr ? 'الحد الأدنى' : 'Min'}</th>
              <th style={{ padding: 10 }}>{isAr ? 'الكمية المطلوبة' : 'Order Qty'}</th>
              <th style={{ padding: 10 }}>{isAr ? 'إجراء' : 'Action'}</th>
            </tr></thead>
            <tbody>
              {alerts.length > 0 ? alerts.map((a: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 10, fontWeight: 600 }}>{a.productName}</td>
                  <td style={{ padding: 10, textAlign: 'center', color: '#F44336', fontWeight: 700 }}>{a.currentQty}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{a.minQty}</td>
                  <td style={{ padding: 10, textAlign: 'center', color: '#4CAF50', fontWeight: 700 }}>{a.orderQty}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button style={{ padding: '4px 12px', borderRadius: 6, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>{isAr ? 'إنشاء أمر شراء' : 'Create PO'}</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#4CAF50' }}>✅ {isAr ? 'كل المنتجات فوق الحد الأدنى' : 'All products above minimum'}</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#E3F2FD' }}>
              <th style={{ padding: 10 }}>{isAr ? 'المنتج' : 'Product'}</th>
              <th style={{ padding: 10 }}>{_t('Min', 'Min')}</th>
              <th style={{ padding: 10 }}>{_t('Max', 'Max')}</th>
              <th style={{ padding: 10 }}>{isAr ? 'كمية الطلب' : 'Reorder Qty'}</th>
              <th style={{ padding: 10 }}>{isAr ? 'المورد' : 'Supplier'}</th>
            </tr></thead>
            <tbody>
              {rules.length > 0 ? rules.map((r: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 10 }}>{r.productId}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{r.minQty}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{r.maxQty}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{r.reorderQty}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{r.supplierId || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد قواعد' : 'No rules'}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
