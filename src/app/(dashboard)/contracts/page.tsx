'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function ContractsPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [contracts, setContracts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/contracts?view=summary').then(r => r.json()).then(setSummary).catch(() => {});
    fetch('/api/contracts').then(r => r.json()).then(d => setContracts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const statusColor = (c: any) => c.isExpired ? '#F44336' : c.isExpiring ? '#FF9800' : '#4CAF50';
  const statusLabel = (c: any) => c.isExpired ? (isAr ? 'منتهي' : 'Expired') : c.isExpiring ? (isAr ? 'قارب الانتهاء' : 'Expiring') : (isAr ? 'نشط' : 'Active');

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '📄 إدارة العقود' : '📄 Contract Management'}</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 20px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {isAr ? '+ عقد جديد' : '+ New Contract'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: summary.total || 0, color: '#2196F3', icon: '📋' },
          { label: isAr ? 'نشط' : 'Active', value: summary.active || 0, color: '#4CAF50', icon: '✅' },
          { label: isAr ? 'قارب الانتهاء' : 'Expiring', value: summary.expiring || 0, color: '#FF9800', icon: '⚠️' },
          { label: isAr ? 'منتهي' : 'Expired', value: summary.expired || 0, color: '#F44336', icon: '❌' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: `4px solid ${kpi.color}` }}>
            <div style={{ fontSize: 12, color: '#888' }}>{kpi.icon} {kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 12, textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الرقم' : 'Number'}</th>
            <th style={{ padding: 12, textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'العنوان' : 'Title'}</th>
            <th style={{ padding: 12, textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'النوع' : 'Type'}</th>
            <th style={{ padding: 12, textAlign: 'center' }}>{isAr ? 'تاريخ الانتهاء' : 'End Date'}</th>
            <th style={{ padding: 12, textAlign: 'center' }}>{isAr ? 'الأيام المتبقية' : 'Days Left'}</th>
            <th style={{ padding: 12, textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
            <th style={{ padding: 12, textAlign: 'center' }}>{isAr ? 'القيمة' : 'Value'}</th>
          </tr></thead>
          <tbody>
            {contracts.length > 0 ? contracts.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12 }}>{c.number}</td>
                <td style={{ padding: 12, fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: 12 }}>{c.type}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString('ar-SA') : '—'}</td>
                <td style={{ padding: 12, textAlign: 'center', fontWeight: 700, color: statusColor(c) }}>{c.daysLeft ?? '—'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <span style={{ background: statusColor(c) + '20', color: statusColor(c), padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{statusLabel(c)}</span>
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>{Number(c.value || 0).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد عقود' : 'No contracts'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
