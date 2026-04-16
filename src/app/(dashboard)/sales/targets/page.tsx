'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

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
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
                alert(t('sales.str_2482'));
            }
        } catch (e) {}
    };

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (<>
        <div className="page-header"><h1 className="page-title">{t('sales.str_2469')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar" style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ margin: 0, width: '120px' }}>
                    <select className="input" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {[...Array(5)].map((_, i) => <option key={i} value={d.getFullYear() - 2 + i}>{d.getFullYear() - 2 + i}</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, width: '150px' }}>
                    <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                        {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{t('sales.str_2470')}{i + 1}</option>)}
                    </select>
                </div>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">{t('sales.str_2471')}</button>
            </div>

            <div className="grid-3" style={{ marginTop: '20px' }}>
                {loading ? <div style={{ padding: '20px' }}>{t('sales.str_2472')}</div> : targets.length === 0 ? <div style={{ padding: '20px', color: 'var(--text-muted)' }}>{t('sales.str_2473')}</div> : targets.map((target: any) => {
                    const isSuper = target.achievementPct >= 100;
                    const isMid = target.achievementPct >= 50 && target.achievementPct < 100;
                    const color = isSuper ? '#10b981' : isMid ? '#f59e0b' : '#ef4444';
                    
                    return (
                        <div key={target.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>{target.employee.name}</h3>
                                {isSuper && <span title={t('sales.str_2483')} style={{ fontSize: '20px' }}>⭐</span>}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <span>{t('sales.str_2474')}<strong>{fmt(target.targetAmount)}</strong></span>
                                <span>{t('sales.str_2475')}<strong style={{color: 'var(--text)'}}>{fmt(target.actualAmount)}</strong></span>
                            </div>
                            
                            <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(target.achievementPct, 100)}%`,
                                    height: '100%',
                                    backgroundColor: color,
                                    transition: 'width 1s ease-in-out'
                                }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                <span style={{ fontWeight: 'bold', color: color }}>{target.achievementPct.toFixed(1)}{t('sales.str_2476')}</span>
                                <span style={{ fontSize: '12px', backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {t('sales.str_2477')}<strong style={{ color: '#10b981' }}>{isSuper ? fmt(target.actualAmount * 0.05) : isMid ? fmt(target.actualAmount * 0.02) : '0'} {t('sys.str_68')}</strong>
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
                    <h2>{t('sales.str_2478')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sales.str_2479')}</label>
                            <select required className="input" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                                <option value="">{t('hr.str_2138')}</option>
                                {employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('sys.str_1109')}</label>
                                <input required type="number" className="input" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('sys.str_1108')}</label>
                                <input required type="number" className="input" value={form.month} onChange={e => setForm({...form, month: e.target.value})} />
                            </div>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sales.str_2480')}</label>
                            <input required type="number" step="0.01" className="input" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                            <button type="submit" className="btn btn-primary">{t('sales.str_2481')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
