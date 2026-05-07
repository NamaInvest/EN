'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function VendorPortalPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [tab, setTab] = useState('pos');

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{isAr ? '🏪 بوابة الموردين' : '🏪 Vendor Portal'}</h1>
      <p style={{ color: '#888', marginBottom: 20 }}>{isAr ? 'إدارة أوامر الشراء والفواتير والمدفوعات' : 'Manage POs, invoices, and payments'}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'pos', label: isAr ? 'أوامر الشراء' : 'Purchase Orders' },
          { key: 'invoices', label: isAr ? 'الفواتير' : 'Invoices' },
          { key: 'payments', label: isAr ? 'المدفوعات' : 'Payments' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: tab === t.key ? '#2196F3' : '#e8e8e8', color: tab === t.key ? '#fff' : '#555', cursor: 'pointer', fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {tab === 'pos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>{isAr ? 'أوامر الشراء' : 'Purchase Orders'}</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 10 }}>#</th>
                <th style={{ padding: 10 }}>{isAr ? 'التاريخ' : 'Date'}</th>
                <th style={{ padding: 10 }}>{isAr ? 'القيمة' : 'Amount'}</th>
                <th style={{ padding: 10 }}>{isAr ? 'الحالة' : 'Status'}</th>
              </tr></thead>
              <tbody><tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد أوامر' : 'No orders'}</td></tr></tbody>
            </table>
          </div>
        )}
        {tab === 'invoices' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>{isAr ? 'الفواتير المقدمة' : 'Submitted Invoices'}</h3>
              <button style={{ padding: '8px 20px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>{isAr ? '+ رفع فاتورة' : '+ Submit Invoice'}</button>
            </div>
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{isAr ? 'لا توجد فواتير' : 'No invoices'}</div>
          </div>
        )}
        {tab === 'payments' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>{isAr ? 'المدفوعات' : 'Payments'}</h3>
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>{isAr ? 'لا توجد مدفوعات' : 'No payments'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
