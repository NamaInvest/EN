import { _t } from '@/lib/server-t';
'use client';
import { Users, UserPlus, FileText, GraduationCap, TrendingUp, CalendarDays, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function HrCoreDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const kpis = [
    { l: _t('إجمالي الموظفين', 'Total Employees'), v: 245, s: _t('العدد النشط', 'Active headcount'), c: '#0EA5E9', ic: Users },
    { l: _t('وظائف شاغرة', 'Open Positions'), v: 8, s: _t('إعلانات نشطة', 'Active postings'), c: '#6366F1', ic: Search },
    { l: _t('مستندات منتهية', 'Expiring Docs'), v: 12, s: _t('إقامات/جوازات خلال 30 يوم', 'Iqamas/Passports in 30 days'), c: '#F59E0B', ic: FileText },
    { l: _t('إجازات معلقة', 'Pending Leaves'), v: 5, s: _t('بانتظار الاعتماد', 'Awaiting approval'), c: '#22C55E', ic: CalendarDays },
  ];

  const recentHires = [
    { id: 1, name: 'Faisal Al-Otaibi', position: _t('محاسب أول', 'Senior Accountant'), date: '2026-05-01' },
    { id: 2, name: 'Sara Kamel', position: _t('أخصائية موارد بشرية', 'HR Specialist'), date: '2026-04-28' },
  ];

  const ops = [
    { href: '/hr/jobs', icon: Search, c: '#6366F1', title: _t('التوظيف (ATS)', 'Recruitment (ATS)'), desc: _t('إدارة الإعلانات الوظيفية وتتبع المتقدمين والمقابلات', 'Manage job postings, applicant tracking, and interviews') },
    { href: '/hr/training', icon: GraduationCap, c: '#22C55E', title: _t('التعلم والتطوير', 'Learning & Dev'), desc: _t('تتبع تدريب الموظفين والدورات الإلزامية والمهارات', 'Track employee training, mandatory courses, and skills') },
    { href: '/hr/evaluations', icon: TrendingUp, c: '#F59E0B', title: _t('الأداء', 'Performance'), desc: _t('تقييمات 360 وتحديد الأهداف وخطط تحسين الأداء', 'Run 360 evaluations, goal setting, and PIP tracking') },
    { href: '/hr/documents', icon: FileText, c: '#EF4444', title: _t('المستندات', 'Documents'), desc: _t('مراقبة انتهاء الإقامات والجوازات والتأمين الطبي', 'Monitor Iqama, passport, and medical insurance expirations') },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#0EA5E9" /> {_t('الموارد البشرية', 'Human Resources (HR Core)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة دورة حياة الموظف والتوظيف والتدريب والأداء', 'Manage employee lifecycle, recruitment, training, and performance')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> {_t('تصدير الأعداد', 'Export Headcount')}</button>
          <Link href="/hr/employees/create"><button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UserPlus size={16} /> {_t('موظف جديد', 'New Employee')}</button></Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${c.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.l}</span>
              <c.ic size={18} color={c.c} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={18} color="#0EA5E9" /> {_t('آخر التعيينات', 'Recent Hires')}</h3>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض الكل', 'View All')}</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{_t('الاسم', 'Name')}</th>
                <th>{_t('المنصب', 'Position')}</th>
                <th>{_t('تاريخ التعيين', 'Hire Date')}</th>
              </tr>
            </thead>
            <tbody>
              {recentHires.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: '600' }}>{h.name}</td>
                  <td>{h.position}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{h.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('عمليات الموارد البشرية', 'HR Operations')}</h3>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {ops.map((o, i) => (
              <Link key={i} href={o.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <o.icon size={24} color={o.c} style={{ marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{o.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{o.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
