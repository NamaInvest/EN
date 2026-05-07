'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function TimesheetPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [grid, setGrid] = useState<any>(null);
  const days = isAr ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const today = new Date();
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    fetch(`/api/hr/timesheet?employeeId=1&weekStart=${weekStart.toISOString().split('T')[0]}`).then(r => r.json()).then(setGrid).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '⏱️ سجل الدوام' : '⏱️ Timesheet'}</h1>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#E3F2FD', borderRadius: 8, padding: '12px 20px' }}>
            <div style={{ fontSize: 11, color: '#666' }}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1565C0' }}>{grid?.totalHours || 0}</div>
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 8, padding: '12px 20px' }}>
            <div style={{ fontSize: 11, color: '#666' }}>{isAr ? 'ساعات قابلة للفوترة' : 'Billable Hours'}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2E7D32' }}>{grid?.billableHours || 0}</div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'المشروع' : 'Project'}</th>
            {days.map(d => <th key={d} style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center', fontSize: 12 }}>{d}</th>)}
            <th style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>{isAr ? 'المجموع' : 'Total'}</th>
          </tr></thead>
          <tbody>
            {(grid?.rows || []).length > 0 ? grid.rows.map((row: any) => (
              <tr key={row.projectId}>
                <td style={{ padding: 10, border: '1px solid #e0e0e0', fontWeight: 600 }}>{row.name}</td>
                {(grid?.days || []).map((d: string) => (
                  <td key={d} style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                    <input type="number" defaultValue={row.hours?.[d] || ''} style={{ width: 50, textAlign: 'center', border: '1px solid #e0e0e0', borderRadius: 4, padding: 4 }} min={0} max={24} step={0.5} />
                  </td>
                ))}
                <td style={{ padding: 10, border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 700 }}>
                  {Object.values(row.hours || {}).reduce((a: number, b: any) => a + Number(b), 0)}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#999' }}>{isAr ? 'لا توجد بيانات — أضف مشروع وسجل ساعات' : 'No data — add project and log hours'}</td></tr>
            )}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button style={{ padding: '8px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{isAr ? '💾 حفظ' : '💾 Save'}</button>
          <button style={{ padding: '8px 24px', borderRadius: 8, background: '#FF9800', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{isAr ? '📤 إرسال للاعتماد' : '📤 Submit'}</button>
        </div>
      </div>
    </div>
  );
}
