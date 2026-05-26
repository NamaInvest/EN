'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { FolderGit2, Landmark, CheckSquare, ShieldAlert, Users, Calendar, ArrowRight, DollarSign, Clock, AlertTriangle, Ban, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectListItem {
  id: number;
  name: string;
  budget: number;
  consumedBudget: number;
  remainingBudget: number;
  budgetHealth: 'healthy' | 'warning' | 'danger';
  taskProgress: string;
  customer?: { name: string } | null;
  _count: {
    tasks: number;
    phases: number;
    milestones: number;
    risks: number;
    resources: number;
  };
}

interface ProjectDetail extends ProjectListItem {
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tasks: Array<{ id: number; name: string; status: string; cost: number }>;
  milestones: Array<{ id: number; name: string; status: string; dueDate: string }>;
  risks: Array<{ id: number; name: string; status: string; severity: string; impact: string }>;
  resources: Array<{ id: number; employee?: { name: string } | null; allocationPercentage: number }>;
  timeEntries: Array<{ id: number; date: string; hours: number; description: string; billable: boolean }>;
  analytics: {
    consumedBudget: number;
    remainingBudget: number;
    budgetUtilization: string | number;
    totalHours: number;
    billableHours: number;
    taskProgress: string | number;
    completedTasks: number;
    totalTasks: number;
    achievedMilestones: number;
    totalMilestones: number;
    openRisks: number;
  };
}

export default function ProjectsDashboardPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [projectsList, setProjectsList] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects list first
  const fetchList = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/projects/advanced', { headers });
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data || []);
        // Automatically select the first project if available
        if (data && data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } else {
        setError(_t('فشل تحميل قائمة المشاريع', 'Failed to fetch projects list'));
      }
    } catch (e: any) {
      setError(e?.message || _t('حدث خطأ غير متوقع', 'Unexpected error occurred'));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Fetch project details when selection changes
  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      try {
        setLoadingDetail(true);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/advanced?projectId=${selectedProjectId}`, { headers });
        if (res.ok) {
          const detail = await res.json();
          setProjectDetail(detail);
        }
      } catch {} finally {
        setLoadingDetail(false);
      }
    })();
  }, [selectedProjectId]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });

  // Summary Metrics across all projects
  const totalProjects = projectsList.length;
  const combinedBudget = projectsList.reduce((sum, p) => sum + p.budget, 0);
  const combinedConsumed = projectsList.reduce((sum, p) => sum + p.consumedBudget, 0);
  const combinedRemaining = combinedBudget - combinedConsumed;

  const kpis = [
    { l: _t('إجمالي المشاريع النشطة', 'Total Projects'), v: totalProjects, s: _t('مشاريع مسجلة بالـ PMO', 'Active projects in portfolio'), c: '#4F46E5', ic: FolderGit2 },
    { l: _t('ميزانية المحفظة الكلية', 'Portfolio Budget'), v: `${fmt(combinedBudget)} ${_t('ر.س', 'SAR')}`, s: _t('إجمالي الميزانيات المعتمدة', 'Combined budget of all projects'), c: '#10B981', ic: DollarSign },
    { l: _t('المصروف الفعلي (EVM)', 'Consumed Budget'), v: `${fmt(combinedConsumed)} ${_t('ر.س', 'SAR')}`, s: `${_t('المتبقي:', 'Remaining:')} ${fmt(combinedRemaining)}`, c: '#F59E0B', ic: Landmark },
  ];

  const quickActions = [
    { href: '#', label: _t('إدارة المعالم الزمنية', 'Project Milestones'), desc: _t('عرض المعالم والمراحل وتتبع نسب الإنجاز وجداول المهام', 'Track phases, milestones, and task lists'), c: '#4F46E5' },
    { href: '#', label: _t('تسجيل أوقات العمل', 'Time Sheets logs'), desc: _t('مراجعة ساعات عمل الموظفين والمهام القابلة للفوترة', 'Review employee working hours and billable logs'), c: '#10B981' },
    { href: '#', label: _t('سجل تقييم المخاطر', 'Risk Register'), desc: _t('مراقبة مستويات الخطورة والإجراءات الوقائية للمشاريع', 'Monitor project risks, severity, and mitigation tasks'), c: '#EF4444' },
    { href: '#', label: _t('توزيع الموارد البشرية', 'Resource Allocations'), desc: _t('تخطيط مهندسي الميدان والمطورين والنسب المخصصة', 'Allocate employees and inspect team bandwidth'), c: '#6366F1' }
  ];

  if (loadingList) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>{_t('جاري جلب قائمة المشاريع والميزانيات لـ PMO...', 'Loading projects portfolio and PMO metrics...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '32px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>{_t('فشل تحميل لوحة تحكم المشاريع', 'Failed to load PMO Dashboard')}</h3>
          <p style={{ color: '#B91C1C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>{_t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header with Project Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderGit2 size={28} color="#4F46E5" /> {_t('لوحة تحكم المشاريع ومحفظة PMO', 'Projects & PMO Portfolio Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('معاينة صحة المشاريع، الميزانيات المتبقية، المخاطر، وتوجيه الموارد الميدانية', 'Monitor projects health, budget utilization, milestones timeline, and resources')}</p>
        </div>

        {/* Project Selector */}
        {totalProjects > 0 && (
          <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>{_t('اختر المشروع للمعاينة التفصيلية', 'Select Project Detail')}</label>
            <select 
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', background: 'var(--bg-main)', outline: 'none' }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(parseInt(e.target.value) || null)}
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Portfolio KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${c.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.l}</span>
              <c.ic size={20} color={c.c} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.v}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Project details / Overview list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Project Detailed KPI Panel */}
        {projectDetail && (
          <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-main)' }}>
                {_t('تفاصيل ومؤشرات أداء المشروع:', 'Project PMO Details:')} <span style={{ color: '#4F46E5' }}>{projectDetail.name}</span>
              </h3>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: projectDetail.budgetHealth === 'healthy' ? '#ECFDF5' : projectDetail.budgetHealth === 'warning' ? '#FFFBEB' : '#FEF2F2', color: projectDetail.budgetHealth === 'healthy' ? '#047857' : projectDetail.budgetHealth === 'warning' ? '#B45309' : '#EF4444', fontWeight: 'bold' }}>
                {_t('حالة الميزانية:', 'Budget Health:')} {projectDetail.budgetHealth.toUpperCase()}
              </span>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto' }}></div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {/* Budget Utilization bar */}
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary, #f8fafc)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{_t('استهلاك الميزانية', 'Budget Utilized')}</span>
                    <strong style={{ fontFamily: 'monospace' }}>{projectDetail.analytics?.budgetUtilization ?? 0}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(projectDetail.analytics?.budgetUtilization ?? 0), 100)}%`, height: '100%', background: projectDetail.budgetHealth === 'healthy' ? '#10B981' : projectDetail.budgetHealth === 'warning' ? '#F59E0B' : '#EF4444', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {_t('المصروف:', 'Spent:')} {fmt(projectDetail.consumedBudget)} / {fmt(projectDetail.budget)}
                  </div>
                </div>

                {/* Task Progress */}
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary, #f8fafc)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{_t('تقدم مهام المشروع', 'Task Progress')}</span>
                    <strong style={{ fontFamily: 'monospace' }}>{projectDetail.analytics?.taskProgress ?? 0}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(projectDetail.analytics?.taskProgress ?? 0), 100)}%`, height: '100%', background: '#6366F1', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {_t('المنجز:', 'Tasks:')} {projectDetail.analytics?.completedTasks} / {projectDetail.analytics?.totalTasks}
                  </div>
                </div>

                {/* PMO Counters */}
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary, #f8fafc)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{_t('المعالم المنجزة', 'Milestones Achieved')}</span>
                    <strong>{projectDetail.analytics?.achievedMilestones} / {projectDetail.analytics?.totalMilestones}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{_t('المخاطر المفتوحة', 'Open Risks')}</span>
                    <strong style={{ color: projectDetail.analytics?.openRisks > 0 ? '#EF4444' : 'var(--text-main)' }}>{projectDetail.analytics?.openRisks}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Projects List Table */}
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderGit2 size={18} color="#4F46E5" /> {_t('كشف ومتابعة محفظة المشاريع النشطة', 'Active Projects Register')}
            </h3>
          </div>
          {projectsList.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('اسم المشروع', 'Project Name')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{_t('العميل', 'Customer')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('الميزانية', 'Budget')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{_t('المصروف', 'Consumed')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{_t('التقدم', 'Progress')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{_t('الحالة المالية', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsList.map(p => (
                    <tr 
                      key={p.id} 
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedProjectId === p.id ? 'rgba(79,70,229,0.03)' : 'transparent' }}
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.name} {selectedProjectId === p.id && <ChevronRight size={14} />}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.customer?.name || _t('عميل عام', 'General Customer')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left', fontFamily: 'monospace' }} dir="ltr">{fmt(p.budget)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left', fontFamily: 'monospace' }} dir="ltr">{fmt(p.consumedBudget)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.taskProgress}%</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: p.budgetHealth === 'healthy' ? '#ECFDF5' : p.budgetHealth === 'warning' ? '#FFFBEB' : '#FEF2F2', color: p.budgetHealth === 'healthy' ? '#047857' : p.budgetHealth === 'warning' ? '#B45309' : '#EF4444', fontWeight: 'bold' }}>
                          {p.budgetHealth.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Ban size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p>{_t('لا يوجد مشاريع مسجلة في محفظة PMO حالياً.', 'No projects found.')}</p>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="card" style={{ borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {_t('عمليات وأدوات إدارة المشاريع السريعة', 'PMO Operations & Actions')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {quickActions.map((q, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', height: '100%', boxSizing: 'border-box', opacity: 0.8 }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: q.c, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {q.label}
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{q.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
