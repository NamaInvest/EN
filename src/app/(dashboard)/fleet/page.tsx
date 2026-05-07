'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function FleetPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [dashboard, setDashboard] = useState<any>({});
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetch('/api/fleet/advanced?view=dashboard').then(r => r.json()).then(setDashboard).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '🚛 إدارة الأسطول' : '🚛 Fleet Management'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: isAr ? 'إجمالي المركبات' : 'Total Vehicles', value: dashboard.totalVehicles || 0, color: '#2196F3', icon: '🚗' },
          { label: isAr ? 'متاحة' : 'Available', value: dashboard.available || 0, color: '#4CAF50', icon: '✅' },
          { label: isAr ? 'في الصيانة' : 'In Maintenance', value: dashboard.inMaintenance || 0, color: '#FF9800', icon: '🔧' },
          { label: isAr ? 'خارج الخدمة' : 'Out of Service', value: dashboard.outOfService || 0, color: '#F44336', icon: '❌' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: `4px solid ${kpi.color}` }}>
            <div style={{ fontSize: 12, color: '#888' }}>{kpi.icon} {kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
          { key: 'fuel', label: isAr ? 'الوقود' : 'Fuel' },
          { key: 'maintenance', label: isAr ? 'الصيانة' : 'Maintenance' },
          { key: 'docs', label: isAr ? 'المستندات' : 'Documents' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: tab === t.key ? '#2196F3' : '#e8e8e8', color: tab === t.key ? '#fff' : '#555', cursor: 'pointer', fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {tab === 'overview' && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🚛</div><p>{isAr ? 'قائمة المركبات' : 'Vehicle list'}</p></div>}
        {tab === 'fuel' && <div><h3 style={{ marginBottom: 12 }}>{isAr ? 'سجل الوقود' : 'Fuel Log'}</h3><div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{isAr ? 'لا توجد سجلات' : 'No records'}</div></div>}
        {tab === 'maintenance' && <div><h3 style={{ marginBottom: 12 }}>{isAr ? 'جدول الصيانة' : 'Maintenance'}</h3><div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{isAr ? 'لا توجد صيانة' : 'No maintenance'}</div></div>}
        {tab === 'docs' && <div><h3 style={{ marginBottom: 12 }}>{isAr ? 'مستندات منتهية' : 'Expiring Docs'}</h3><div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{isAr ? 'لا توجد' : 'None'}</div></div>}
      </div>
    </div>
  );
}
