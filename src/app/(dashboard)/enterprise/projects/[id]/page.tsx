'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { 
    LayoutDashboard, Plus, ArrowRight, UserCircle, 
    Clock, CheckCircle, AlertTriangle, PlayCircle,
    TrendingUp, AlignLeft, DollarSign, Target
} from 'lucide-react';

export default function ProjectDetails({ params }: { params: { id: string } }) {
    const { t } = useTranslation();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ 
        taskName: '', description: '', assignedTo: '', budget: '', startDate: '', endDate: '' 
    });

    useEffect(() => { fetchData(); }, [params.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/enterprise/projects/tasks?projectId=${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks);
                setProject(data.project);
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/enterprise/projects/tasks', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, projectId: params.id })
            });

            if (res.ok) { setShowModal(false); fetchData(); } 
            else { alert('فشل الحفظ'); }
        } catch (error) { alert('خطأ في الاتصال'); } 
        finally { setSaving(false); }
    };

    const updateTaskStatus = async (taskId: number, newStatus: string) => {
        const token = localStorage.getItem('token');
        await fetch('/api/enterprise/projects/tasks', {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: taskId, status: newStatus })
        });
        fetchData();
    };

    const updateTaskCost = async (taskId: number, currentCost: number) => {
        const extra = prompt('أدخل التكلفة الإضافية المحروقة لهذه المهمة أو الرواتب (SAR):');
        if (!extra || isNaN(parseFloat(extra))) return;
        
        const token = localStorage.getItem('token');
        await fetch('/api/enterprise/projects/tasks', {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: taskId, actualCost: currentCost + parseFloat(extra) })
        });
        fetchData();
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
    if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>المشروع غير موجود</div>;

    const totalTaskBudget = tasks.reduce((a, b) => a + b.budget, 0);
    const totalTaskCost = tasks.reduce((a, b) => a + b.actualCost, 0);
    const costPercentage = totalTaskBudget > 0 ? (totalTaskCost / totalTaskBudget) * 100 : 0;
    
    // Overall Project vs Tasks mismatch warning
    const budgetMismatch = totalTaskBudget > project.budget;

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button className="btn btn-ghost" onClick={() => router.push('/enterprise/projects')} style={{ padding: '8px' }}>
                    <ArrowRight size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{project.name}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        العميل: {project.customer?.name} | رمز المشروع: PROJ-{project.id}
                    </p>
                </div>
            </div>

            {/* Dashboard Analytics for this single project */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ padding: '20px', borderRight: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ميزانية المشروع الكلية المعتمدة</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0' }}>{project.budget.toLocaleString()} SAR</div>
                    <div style={{ fontSize: '12px', color: budgetMismatch ? 'var(--danger)' : 'var(--success)' }}>
                        الموزع على المهام: {totalTaskBudget.toLocaleString()}
                        {budgetMismatch && ' ⚠️ الموزع تجاوز ميزانية المشروع القطعية!'}
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', borderRight: '4px solid var(--danger)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>التكاليف المستهلكة فعلياً (Actuals)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0', color: 'var(--danger)' }}>{totalTaskCost.toLocaleString()} SAR</div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-body)', borderRadius: '2px', marginTop: '10px' }}>
                        <div style={{ width: `${Math.min(costPercentage, 100)}%`, height: '100%', background: costPercentage > 100 ? 'var(--danger)' : 'var(--warning)', borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'left' }}>استهلاك {costPercentage.toFixed(1)}% من المخصص</div>
                </div>

                <div className="card" style={{ padding: '20px', borderRight: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>عدد المهام والجداوليات (WBS)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0' }}>{tasks.length} <span style={{fontSize:'12px', fontWeight:'normal'}}>مهمة</span></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        مكتمل: {tasks.filter(t => t.status === 'COMPLETED').length} | جاري: {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </div>
                </div>
            </div>

            {/* WBS Tasks List */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlignLeft size={20} color="var(--primary)" />
                        هيكل تقسيم العمل (WBS) والجداوليات
                    </h2>
                    <button className="btn btn-primary btn-sm" style={{ display: 'flex', gap: '6px' }} onClick={() => setShowModal(true)}>
                        <Plus size={16} /> تقسيم مهمة جديدة
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: '800px' }}>
                        <thead style={{ background: 'var(--bg-body)' }}>
                            <tr>
                                <th>المهمة (Task)</th>
                                <th>الموظف/المهندس</th>
                                <th>الميزانية (SAR)</th>
                                <th>المنصرف الفعلي</th>
                                <th>الحالة</th>
                                <th>تحديثات إدارية</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{task.taskName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.description}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <UserCircle size={16} color="var(--text-muted)" />
                                            {task.assignedTo || 'غير محدد'}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{task.budget.toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: task.actualCost > task.budget ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                                                {task.actualCost.toLocaleString()}
                                            </span>
                                            <button className="btn btn-ghost btn-sm" onClick={() => updateTaskCost(task.id, task.actualCost)} title="إضافة تكلفة/رواتب" style={{ padding: '4px' }}>
                                                <DollarSign size={14} color="var(--warning)" />
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                            background: task.status === 'COMPLETED' ? 'var(--success)' : task.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--bg-body)',
                                            color: task.status === 'PENDING' ? 'var(--text)' : '#fff'
                                        }}>
                                            {task.status === 'PENDING' ? 'قيد الانتظار' : task.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مكتملة'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '6px' }}>
                                        {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} style={{ padding: '4px 8px' }}><PlayCircle size={16} /></button>
                                        )}
                                        {task.status === 'IN_PROGRESS' && (
                                            <button className="btn btn-success btn-sm" onClick={() => updateTaskStatus(task.id, 'COMPLETED')} style={{ padding: '4px 8px' }}><CheckCircle size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>لم يتم تقسيم جدول المهام لهذا المشروع بعد.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>إضافة مهمة جديدة لمشروع: {project.name}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave} className="grid-2">
                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">اسم المهمة (مثال: حفر الأساسات, توريد الخرسانة) *</label>
                                    <input className="input" required value={formData.taskName} onChange={e => setFormData({...formData, taskName: e.target.value})} />
                                </div>
                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">تفاصيل إضافية</label>
                                    <textarea className="input" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">مهندس/موظف التنفيذ</label>
                                    <input className="input" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">الميزانية المخصصة للخلية (SAR) *</label>
                                    <input className="input" type="number" dir="ltr" required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">تاريخ البدء</label>
                                    <input className="input" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">تاريخ الانتهاء</label>
                                    <input className="input" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', gridColumn: '1 / -1' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>💾 حفظ المهمة</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
