'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function QualityPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [dashboard, setDashboard] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/manufacturing/quality?view=dashboard').then(r => r.json()).then(setDashboard).catch(() => {});
    fetch('/api/manufacturing/quality').then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '🔍 فحص الجودة' : '🔍 Quality Inspection'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #2196F3' }}>
          <div style={{ fontSize: 12, color: '#888' }}>{isAr ? 'إجمالي الفحوصات' : 'Total Inspections'}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2196F3' }}>{dashboard.total || 0}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #4CAF50' }}>
          <div style={{ fontSize: 12, color: '#888' }}>{isAr ? 'ناجح' : 'Passed'}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#4CAF50' }}>{dashboard.passed || 0}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #F44336' }}>
          <div style={{ fontSize: 12, color: '#888' }}>{isAr ? 'فاشل' : 'Failed'}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F44336' }}>{dashboard.failed || 0}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #FF9800' }}>
          <div style={{ fontSize: 12, color: '#888' }}>{isAr ? 'نسبة النجاح' : 'Pass Rate'}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#FF9800' }}>{dashboard.passRate || 0}%</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 12 }}>#</th>
            <th style={{ padding: 12 }}>{isAr ? 'الخطة' : 'Plan'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'الحكم' : 'Verdict'}</th>
            <th style={{ padding: 12 }}>{isAr ? 'التاريخ' : 'Date'}</th>
          </tr></thead>
          <tbody>
            {history.map((r: any, i) => (
              <tr key={r.id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, textAlign: 'center' }}>{i + 1}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>{r.planId}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <span style={{ background: r.verdict === 'PASS' ? '#E8F5E9' : '#FFEBEE', color: r.verdict === 'PASS' ? '#4CAF50' : '#F44336', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    {r.verdict === 'PASS' ? (isAr ? 'ناجح ✅' : 'PASS ✅') : (isAr ? 'فاشل ❌' : 'FAIL ❌')}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد فحوصات' : 'No inspections'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
