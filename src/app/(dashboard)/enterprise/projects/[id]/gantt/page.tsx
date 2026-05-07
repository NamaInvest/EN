'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Flag, AlertTriangle, Users, Clock, Plus, CheckCircle, Target } from 'lucide-react';
import { useToast } from '@/components/Toast';

const phaseColors = ['#3B82F6','#8B5CF6','#22C55E','#F97316','#EC4899','#06B6D4','#EAB308'];
const riskColors: any = { LOW:'#22C55E', MEDIUM:'#EAB308', HIGH:'#F97316', CRITICAL:'#EF4444' };
const msColors: any = { PENDING:'#94A3B8', ACHIEVED:'#22C55E', MISSED:'#EF4444', CANCELLED:'#6B7280' };

export default function ProjectGantt({ params }: { params: { id: string } }) {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const router = useRouter();
  const { error: toastError } = useToast();
  const [project, setProject] = useState<any>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [tab, setTab] = useState('gantt');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [params.id]);

  const load = async () => {
    setLoading(true);
    const t = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${t}` };
    try {
      const [pRes, phRes, msRes, rkRes, rsRes] = await Promise.all([
        fetch(`/api/projects/advanced?projectId=${params.id}`, { headers: h }),
        fetch(`/api/projects/phases?projectId=${params.id}`, { headers: h }),
        fetch(`/api/projects/milestones?projectId=${params.id}`, { headers: h }),
        fetch(`/api/projects/risks?projectId=${params.id}`, { headers: h }),
        fetch(`/api/projects/resources?projectId=${params.id}`, { headers: h }),
      ]);
      if (pRes.ok) setProject(await pRes.json());
      if (phRes.ok) setPhases(await phRes.json());
      if (msRes.ok) setMilestones(await msRes.json());
      if (rkRes.ok) setRisks(await rkRes.json());
      if (rsRes.ok) setResources(await rsRes.json());
    } catch (e: any) { toastError(e?.message); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>جاري التحميل...</div>;
  if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>المشروع غير موجود</div>;

  const a = project.analytics || {};
  const tabs = [
    { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
    { id: 'milestones', label: 'المعالم', icon: Flag },
    { id: 'risks', label: 'المخاطر', icon: AlertTriangle },
    { id: 'resources', label: 'الموارد', icon: Users },
  ];

  // Gantt data
  const ganttItems = [
    ...(project.tasks || []).map((t: any) => ({ ...t, type: 'task' })),
    ...phases.map(p => ({ ...p, type: 'phase' })),
  ].filter((i: any) => i.startDate || i.endDate);
  const allDates = ganttItems.flatMap((i: any) => [i.startDate, i.endDate].filter(Boolean).map((d: string) => new Date(d).getTime()));
  const minDate = allDates.length ? new Date(Math.min(...allDates)) : new Date();
  const maxDate = allDates.length ? new Date(Math.max(...allDates)) : new Date(Date.now() + 30*86400000);
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button className="btn btn-ghost" onClick={() => router.push('/enterprise/projects')}><ArrowRight size={22} /></button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>{project.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{project.customer?.name || 'بدون عميل'} • {project.status}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'التقدم', value: `${a.taskProgress || 0}%`, color: '#3B82F6' },
          { label: 'الميزانية المتبقية', value: `${(a.remainingBudget||0).toLocaleString()}`, color: (a.remainingBudget||0) >= 0 ? '#22C55E' : '#EF4444' },
          { label: 'المهام المكتملة', value: `${a.completedTasks||0}/${a.totalTasks||0}`, color: '#8B5CF6' },
          { label: 'ساعات العمل', value: `${a.totalHours||0}h`, color: '#F97316' },
          { label: 'المعالم', value: `${a.achievedMilestones||0}/${a.totalMilestones||0}`, color: '#22C55E' },
          { label: 'المخاطر المفتوحة', value: a.openRisks||0, color: '#EF4444' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
          <span style={{ fontWeight: '600' }}>تقدم المشروع</span>
          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{a.taskProgress || 0}%</span>
        </div>
        <div style={{ height: '10px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${a.taskProgress || 0}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', borderRadius: '6px', transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          <span>الاستهلاك: {a.budgetUtilization || 0}%</span>
          <span>الميزانية: {project.budget?.toLocaleString()} SAR</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 18px', fontSize: '13px', fontWeight: tab === t.id ? '700' : '500',
            color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-2px'
          }}><t.icon size={16} /> {t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'gantt' && (
        <div className="card" style={{ padding: '20px', overflow: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>📊 Gantt Chart</h3>
          {ganttItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>أضف مراحل أو مهام مع تواريخ لعرض الـ Gantt</div>
          ) : (
            <div style={{ minWidth: '600px' }}>
              {/* Timeline header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ width: '200px', flexShrink: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>العنصر</div>
                <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                  {Array.from({ length: Math.min(totalDays + 1, 31) }, (_, i) => {
                    const d = new Date(minDate.getTime() + i * (totalDays / Math.min(totalDays, 30)) * 86400000);
                    return <div key={i} style={{ flex: 1, fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>;
                  })}
                </div>
              </div>
              {/* Bars */}
              {ganttItems.map((item: any, idx: number) => {
                const start = item.startDate ? new Date(item.startDate) : minDate;
                const end = item.endDate ? new Date(item.endDate) : start;
                const leftPct = ((start.getTime() - minDate.getTime()) / (totalDays * 86400000)) * 100;
                const widthPct = Math.max(2, ((end.getTime() - start.getTime()) / (totalDays * 86400000)) * 100);
                const color = item.type === 'phase' ? (item.color || phaseColors[idx % phaseColors.length]) : '#3B82F6';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', height: '32px' }}>
                    <div style={{ width: '200px', flexShrink: 0, fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      {item.name || item.taskName}
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: '20px', background: 'var(--bg-body)', borderRadius: '4px' }}>
                      <div style={{
                        position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                        height: '100%', background: color, borderRadius: '4px', opacity: 0.85,
                        transition: 'all 0.5s ease', minWidth: '8px'
                      }} title={`${item.name || item.taskName}: ${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`} />
                    </div>
                  </div>
                );
              })}
              {/* Milestone diamonds */}
              {milestones.map((ms: any, idx: number) => {
                const msDate = new Date(ms.dueDate);
                const leftPct = ((msDate.getTime() - minDate.getTime()) / (totalDays * 86400000)) * 100;
                return (
                  <div key={`ms-${idx}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', height: '28px' }}>
                    <div style={{ width: '200px', flexShrink: 0, fontSize: '11px', fontWeight: '600', color: msColors[ms.status], display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flag size={12} /> {ms.name}
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: '20px' }}>
                      <div style={{ position: 'absolute', left: `${leftPct}%`, transform: 'rotate(45deg) translate(-50%, -50%)', width: '10px', height: '10px', background: msColors[ms.status] || '#94A3B8', top: '50%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'milestones' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['المعلم', 'المرحلة', 'تاريخ الاستحقاق', 'الحالة'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {milestones.map(ms => (
                <tr key={ms.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}><Flag size={14} style={{ display: 'inline', marginLeft: '4px' }} color={msColors[ms.status]} />{ms.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>{ms.phase?.name || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(ms.dueDate).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (msColors[ms.status]||'#94A3B8')+'20', color: msColors[ms.status] }}>{ms.status}</span></td>
                </tr>
              ))}
              {milestones.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد معالم</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'risks' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['المخاطرة', 'الاحتمالية', 'التأثير', 'الحالة', 'خطة التخفيف'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {risks.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{r.title}</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (riskColors[r.probability]||'#94A3B8')+'20', color: riskColors[r.probability] }}>{r.probability}</span></td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: (riskColors[r.impact]||'#94A3B8')+'20', color: riskColors[r.impact] }}>{r.impact}</span></td>
                  <td style={{ padding: '12px', fontWeight: '600', color: r.status === 'OPEN' ? '#EF4444' : '#22C55E' }}>{r.status}</td>
                  <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>{r.mitigationPlan || '-'}</td>
                </tr>
              ))}
              {risks.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد مخاطر</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'resources' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['المورد', 'الدور', 'التخصيص %', 'السعر/ساعة'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}><Users size={14} style={{ display: 'inline', marginLeft: '6px' }} color="var(--primary)" />{r.employee?.name || r.resourceName || '-'}</td>
                  <td style={{ padding: '12px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{r.role}</span></td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${r.allocation}%`, height: '100%', background: r.allocation > 80 ? '#EF4444' : '#22C55E', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>{r.allocation}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{r.hourlyRate} SAR</td>
                </tr>
              ))}
              {resources.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد موارد</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
