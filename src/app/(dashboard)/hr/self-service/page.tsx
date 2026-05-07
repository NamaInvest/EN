'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function SelfServicePage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState('overview');

  const Card = ({ icon, title, value, color, sub }: { icon: string; title: string; value: string; color: string; sub?: string }) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: `4px solid ${color}` }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{isAr ? '👤 بوابة الموظف' : '👤 Employee Portal'}</h1>
      <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>{isAr ? 'مرحباً، إدارة بياناتك الشخصية' : 'Welcome, manage your personal data'}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
          { key: 'leaves', label: isAr ? 'الإجازات' : 'Leaves' },
          { key: 'payslips', label: isAr ? 'كشوف الراتب' : 'Payslips' },
          { key: 'attendance', label: isAr ? 'الحضور' : 'Attendance' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: activeTab === tab.key ? '#2196F3' : '#e8e8e8', color: activeTab === tab.key ? '#fff' : '#555', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Card icon="💰" title={isAr ? 'آخر راتب' : 'Last Salary'} value="8,500" color="#4CAF50" sub={isAr ? 'أبريل 2026' : 'April 2026'} />
          <Card icon="🏖️" title={isAr ? 'رصيد الإجازات' : 'Leave Balance'} value="18" color="#2196F3" sub={isAr ? 'يوم متبقي' : 'days remaining'} />
          <Card icon="⏰" title={isAr ? 'حضور اليوم' : "Today's Status"} value={isAr ? 'حاضر ✅' : 'Present ✅'} color="#FF9800" sub="08:02 AM" />
          <Card icon="📋" title={isAr ? 'مطالبات معلقة' : 'Pending Claims'} value="2" color="#9C27B0" sub={isAr ? 'بانتظار الاعتماد' : 'Awaiting approval'} />
        </div>
      )}

      {activeTab === 'leaves' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>{isAr ? 'طلبات الإجازة' : 'Leave Requests'}</h3>
            <button style={{ padding: '8px 20px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>{isAr ? '+ طلب إجازة' : '+ Request Leave'}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#E8F5E9', borderRadius: 8, padding: 12, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#4CAF50' }}>21</div><div style={{ fontSize: 11, color: '#666' }}>{isAr ? 'سنوية' : 'Annual'}</div></div>
            <div style={{ background: '#FFF3E0', borderRadius: 8, padding: 12, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#FF9800' }}>3</div><div style={{ fontSize: 11, color: '#666' }}>{isAr ? 'مستخدمة' : 'Used'}</div></div>
            <div style={{ background: '#E3F2FD', borderRadius: 8, padding: 12, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#2196F3' }}>18</div><div style={{ fontSize: 11, color: '#666' }}>{isAr ? 'متبقية' : 'Remaining'}</div></div>
          </div>
          <p style={{ color: '#999', textAlign: 'center' }}>{isAr ? 'لا توجد طلبات حالياً' : 'No current requests'}</p>
        </div>
      )}

      {activeTab === 'payslips' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: 16 }}>{isAr ? 'كشوف الرواتب' : 'Payslips'}</h3>
          {['2026-04', '2026-03', '2026-02', '2026-01'].map(m => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div><span style={{ fontWeight: 600 }}>{m}</span></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#4CAF50' }}>8,500 {isAr ? 'ر.س' : 'SAR'}</span>
                <button style={{ padding: '4px 12px', borderRadius: 6, background: '#E3F2FD', color: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 12 }}>📥 {isAr ? 'تحميل' : 'Download'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: 16 }}>{isAr ? 'سجل الحضور — هذا الشهر' : 'Attendance — This Month'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 30 }, (_, i) => {
              const isWeekend = (i % 7 === 5 || i % 7 === 6);
              return (
                <div key={i} style={{ padding: 8, textAlign: 'center', borderRadius: 6, background: isWeekend ? '#f5f5f5' : '#E8F5E9', fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{i + 1}</div>
                  <div style={{ fontSize: 10, color: isWeekend ? '#999' : '#4CAF50' }}>{isWeekend ? (isAr ? 'عطلة' : 'Off') : '✅'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
