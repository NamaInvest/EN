'use client';
import { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, GraduationCap, TrendingUp, CalendarDays, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Employee {
  id: number;
  name: string;
  position?: string | null;
  startDate?: string | null;
  salary?: number;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  status: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  employee?: {
    name: string;
    position?: string | null;
  } | null;
}

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  employee?: {
    name: string;
  } | null;
}

export default function HrCoreDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [empRes, leaveRes, attRes] = await Promise.all([
          fetch('/api/hr/employees', { headers }),
          fetch('/api/hr/leaves', { headers }),
          fetch('/api/hr/attendance', { headers }),
        ]);

        if (empRes.ok) {
          setEmployees(await empRes.json());
        }
        if (leaveRes.ok) {
          const leafData = await leaveRes.json();
          setLeaves(leafData.requests || []);
        }
        if (attRes.ok) {
          setAttendance(await attRes.json());
        }

      } catch (e: any) {
        setError(e?.message || _t('حدث خطأ أثناء جلب بيانات الموارد البشرية', 'Failed to fetch HR data'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalEmployees = employees.length;
  const pendingLeavesCount = leaves.filter(r => r.status === 'PENDING' || r.status === 'pending').length;
  const activePresentToday = attendance.filter(a => a.checkIn).length;

  const kpis = [
    { l: _t('إجمالي الموظفين', 'Total Employees'), v: totalEmployees, s: _t('العدد النشط المسجل', 'Registered headcount'), c: '#0EA5E9', ic: Users },
    { l: _t('الحضور اليومي', 'Present Today'), v: activePresentToday, s: _t('تسجيلات الدخول لليوم', 'Check-ins logged today'), c: '#22C55E', ic: CheckCircle },
    { l: _t('إجازات معلقة', 'Pending Leaves'), v: pendingLeavesCount, s: _t('بانتظار موافقة الإدارة', 'Awaiting approval'), c: '#F59E0B', ic: CalendarDays },
    { l: _t('طلبات الإجازات النشطة', 'Active Leaves'), v: leaves.filter(r => r.status === 'APPROVED' || r.status === 'approved').length, s: _t('إجازات معتمدة هذا العام', 'Approved leaves this year'), c: '#6366F1', ic: Clock },
  ];

  const ops = [
    { href: '/hr/jobs', icon: Search, c: '#6366F1', title: _t('التوظيف (ATS)', 'Recruitment (ATS)'), desc: _t('إدارة الإعلانات الوظيفية وتتبع المتقدمين والمقابلات', 'Manage job postings, applicant tracking, and interviews') },
    { href: '/hr/training', icon: GraduationCap, c: '#22C55E', title: _t('التعلم والتطوير', 'Learning & Dev'), desc: _t('تتبع تدريب الموظفين والدورات الإلزامية والمهارات', 'Track employee training, mandatory courses, and skills') },
    { href: '/hr/evaluations', icon: TrendingUp, c: '#F59E0B', title: _t('الأداء والتقييم', 'Performance'), desc: _t('تقييمات 360 وتحديد الأهداف وخطط تحسين الأداء', 'Run 360 evaluations, goal setting, and PIP tracking') },
    { href: '/hr/documents', icon: FileText, c: '#EF4444', title: _t('إدارة المستندات', 'Documents'), desc: _t('مراقبة انتهاء الإقامات والجوازات والتأمين الطبي للموظفين', 'Monitor Iqama, passport, and medical insurance expirations') },
  ];

  // Get the latest 5 hires based on ID
  const recentHires = [...employees]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: '#0EA5E9', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{_t('جاري جلب إحصائيات الموارد البشرية والموظفين...', 'Loading HR stats and employee database...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '32px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>{_t('فشل تحميل لوحة تحكم الموارد البشرية', 'Failed to load HR Dashboard')}</h3>
          <p style={{ color: '#B91C1C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>{_t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#0EA5E9" /> {_t('إدارة الموارد البشرية (HR Core)', 'Human Resources (HR Core)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('متابعة عقود الموظفين، طلبات الإجازات، الحضور اليومي، وتقييمات الأداء', 'Manage employee contracts, leaves, daily attendance, and performance tracking')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/hr/employees"><button className="btn btn-outline">{_t('دليل الموظفين', 'Employees Directory')}</button></Link>
          <Link href="/hr/employees/create">
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={16} /> {_t('إضافة موظف جديد', 'Add Employee')}
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${c.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</span>
              <c.ic size={20} color={c.c} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Hires & HR Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Recent Hires Table */}
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="#0EA5E9" /> {_t('آخر التعيينات الجديدة', 'Recent Hires')}
            </h3>
            <Link href="/hr/employees"><button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>{_t('عرض دليل الموظفين', 'View All')}</button></Link>
          </div>
          {recentHires.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('الاسم الكامل', 'Employee Name')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('المسمى الوظيفي', 'Job Position')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('تاريخ المباشرة', 'Start Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHires.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px' }}>{h.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{h.position || _t('غير محدد', 'Not Specified')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{h.startDate ? new Date(h.startDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB') : _t('غير مسجل', 'Not Recorded')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p>{_t('لا يوجد موظفون مسجلون في قاعدة البيانات حالياً.', 'No employees registered in the database yet.')}</p>
            </div>
          )}
        </div>

        {/* HR Operations */}
        <div className="card" style={{ borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {_t('بوابات وعمليات الموارد البشرية', 'HR Operations & Portals')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {ops.map((o, i) => (
              <Link key={i} href={o.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', height: '100%', boxSizing: 'border-box' }} className="hover-card">
                  <o.icon size={26} color={o.c} style={{ marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>{o.title}</h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{o.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
