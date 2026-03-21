'use client';
import { useState, useEffect } from 'react';

interface Target {
    id: number;
    year: number;
    month: number;
    targetAmount: number;
    employee: { id: number, name: string };
    actualAmount: number;
    achievementPct: number;
}

export default function SalesTargetsPage() {
    const d = new Date();
    const [year, setYear] = useState(d.getFullYear());
    const [month, setMonth] = useState(d.getMonth() + 1);
    
    const [targets, setTargets] = useState<Target[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ employeeId: '', year: year.toString(), month: month.toString(), targetAmount: '' });

    useEffect(() => { loadData(); }, [year, month]);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [tRes, empRes] = await Promise.all([
                fetch(`/api/sales/targets?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (tRes.ok) {
                const data = await tRes.json();
                setTargets(data.targets || []);
            }
            if (empRes.ok) setEmployees(await empRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/sales/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ employeeId: '', year: year.toString(), month: month.toString(), targetAmount: '' });
                loadData();
            } else {
                alert('فشل حفظ المستهدف');
            }
        } catch (e) {}
    };

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (<>
        <div className="page-header"><h1 className="page-title">🎯 مستهدفات المبيعات والعمولات (Sales Targets & KPIs)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar" style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ margin: 0, width: '120px' }}>
                    <select className="input" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {[...Array(5)].map((_, i) => <option key={i} value={d.getFullYear() - 2 + i}>{d.getFullYear() - 2 + i}</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, width: '150px' }}>
                    <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                        {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>شهر {i + 1}</option>)}
                    </select>
                </div>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">➕ تحديد مستهدف جديد لمندوب</button>
            </div>

            <div className="grid-3" style={{ marginTop: '20px' }}>
                {loading ? <div style={{ padding: '20px' }}>جاري الحساب والتحميل...</div> : targets.length === 0 ? <div style={{ padding: '20px', color: 'var(--text-muted)' }}>لا توجد مستهدفات مسجلة لهذا الشهر</div> : targets.map(t => {
                    const isSuper = t.achievementPct >= 100;
                    const isMid = t.achievementPct >= 50 && t.achievementPct < 100;
                    const color = isSuper ? '#10b981' : isMid ? '#f59e0b' : '#ef4444';
                    
                    return (
                        <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>{t.employee.name}</h3>
                                {isSuper && <span title="حقق المستهدف بالكامل" style={{ fontSize: '20px' }}>⭐</span>}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <span>المستهدف: <strong>{fmt(t.targetAmount)}</strong></span>
                                <span>المبيعات: <strong style={{color: 'var(--text)'}}>{fmt(t.actualAmount)}</strong></span>
                            </div>
                            
                            <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(t.achievementPct, 100)}%`,
                                    height: '100%',
                                    backgroundColor: color,
                                    transition: 'width 1s ease-in-out'
                                }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                <span style={{ fontWeight: 'bold', color: color }}>{t.achievementPct.toFixed(1)}% إنجاز</span>
                                <span style={{ fontSize: '12px', backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                    عمولة تقديرية: <strong style={{ color: '#10b981' }}>{isSuper ? fmt(t.actualAmount * 0.05) : isMid ? fmt(t.actualAmount * 0.02) : '0'} ر.س</strong>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Modal */}
        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal" style={{ maxWidth: '500px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>تسجيل مستهدف مبيعات</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">مندوب المبيعات</label>
                            <select required className="input" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                                <option value="">اختر الموظف...</option>
                                {employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">السنة</label>
                                <input required type="number" className="input" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">الشهر</label>
                                <input required type="number" className="input" value={form.month} onChange={e => setForm({...form, month: e.target.value})} />
                            </div>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">المبلغ المستهدف للمبيعات (Target)</label>
                            <input required type="number" step="0.01" className="input" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" className="btn btn-primary">💾 حفظ المستهدف</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
