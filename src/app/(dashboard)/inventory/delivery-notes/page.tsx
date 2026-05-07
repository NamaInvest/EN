'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function DeliveryNotesPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [notes, setNotes] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/shipments/delivery-notes').then(r => r.json()).then(d => setNotes(Array.isArray(d) ? d : d.notes || [])).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = { DRAFT: '#607D8B', CONFIRMED: '#2196F3', DELIVERED: '#4CAF50', INVOICED: '#9C27B0' };
  const statusLabel: Record<string, string> = { DRAFT: isAr ? 'مسودة' : 'Draft', CONFIRMED: isAr ? 'مؤكد' : 'Confirmed', DELIVERED: isAr ? 'تم التسليم' : 'Delivered', INVOICED: isAr ? 'مفوتر' : 'Invoiced' };

  const filtered = filter === 'ALL' ? notes : notes.filter(n => n.status === filter);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '🚚 إذونات التسليم' : '🚚 Delivery Notes'}</h1>
        <button style={{ padding: '8px 20px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {isAr ? '+ إنشاء من أمر بيع' : '+ Create from SO'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['ALL', 'DRAFT', 'CONFIRMED', 'DELIVERED', 'INVOICED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: filter === f ? '#2196F3' : '#e8e8e8', color: filter === f ? '#fff' : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {f === 'ALL' ? (isAr ? 'الكل' : 'All') : statusLabel[f]}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 12 }}>#</th>
            <th style={{ padding: 12 }}>{isAr ? 'أمر البيع' : 'SO Ref'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'العميل' : 'Customer'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'التاريخ' : 'Date'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'الحالة' : 'Status'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'إجراء' : 'Action'}</th>
          </tr></thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((n: any, i) => (
              <tr key={n.id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, textAlign: 'center' }}>{n.number || i + 1}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>{n.soRef || '—'}</td>
                <td style={{ padding: 12 }}>{n.customerName || '—'}</td>
                <td style={{ padding: 12, textAlign: 'center', fontSize: 12 }}>{n.date ? new Date(n.date).toLocaleDateString() : '—'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <span style={{ background: (statusColor[n.status] || '#999') + '20', color: statusColor[n.status] || '#999', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{statusLabel[n.status] || n.status}</span>
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {n.status === 'DRAFT' && <button style={{ padding: '4px 12px', borderRadius: 6, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>{isAr ? 'تأكيد' : 'Confirm'}</button>}
                  {n.status === 'CONFIRMED' && <button style={{ padding: '4px 12px', borderRadius: 6, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>{isAr ? 'تسليم' : 'Deliver'}</button>}
                  {n.status === 'DELIVERED' && <button style={{ padding: '4px 12px', borderRadius: 6, background: '#9C27B0', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>{isAr ? 'فوتر' : 'Invoice'}</button>}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد إذونات' : 'No delivery notes'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
