'use client';
import { useState, useEffect } from 'react';

interface Employee { id: number; name: string; salary: number }
interface Salary { id: number; month: number; year: number; basicSalary: number; additions: number; deductions: number; netSalary: number; notes: string; employee: Employee }

export default function SalariesPage() {
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ employeeId: '', month: new Date().getMonth() + 1 + '', year: new Date().getFullYear() + '', basicSalary: '', additions: '0', deductions: '0', notes: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); loadEmployees(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/salaries'); if (r.ok) setSalaries(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    async function loadEmployees() { try { const r = await fetch('/api/employees'); if (r.ok) { const data = await r.json(); setEmployees(data); } } catch (e) { console.error(e); } };

    const selectEmployee = (id: string) => {
        const emp = employees.find(e => e.id === parseInt(id));
        setForm({ ...form, employeeId: id, basicSalary: emp?.salary?.toString() || '0' });
    };

    const handleSave = async () => { const r = await fetch('/api/salaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); load(); } };
    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });
    const net = (parseFloat(form.basicSalary) || 0) + (parseFloat(form.additions) || 0) - (parseFloat(form.deductions) || 0);

    return (<><div className="page-header"><h1 className="page-title">💰 الرواتب</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{salaries.length} راتب</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ صرف راتب</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>💰 صرف راتب</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الموظف</label><select value={form.employeeId} onChange={e => selectEmployee(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">اختر...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الشهر</label><input type="number" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} min={1} max={12} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>السنة</label><input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الراتب الأساسي</label><input type="number" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>بدلات</label><input type="number" value={form.additions} onChange={e => setForm({ ...form, additions: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>خصومات</label><input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                </div>
                <div style={{ textAlign: 'left', padding: '8px', marginTop: '8px', background: 'rgba(108,99,255,0.05)', borderRadius: '6px', fontWeight: 'bold' }}>صافي الراتب: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{fmt(net)} ر.س</span></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}><button className="btn btn-sm" onClick={() => setShowAdd(false)}>إلغاء</button><button className="btn btn-primary btn-sm" onClick={handleSave}>💰 صرف</button></div>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    salaries.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💰</div><div className="empty-state-text">لا توجد رواتب مصروفة</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>الموظف</th><th style={{ padding: '8px', textAlign: 'center' }}>الشهر</th><th style={{ padding: '8px', textAlign: 'right' }}>الأساسي</th><th style={{ padding: '8px', textAlign: 'right' }}>بدلات</th><th style={{ padding: '8px', textAlign: 'right' }}>خصومات</th><th style={{ padding: '8px', textAlign: 'right' }}>الصافي</th></tr></thead>
                            <tbody>{salaries.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px' }}>{s.employee?.name}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>{s.month}/{s.year}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(s.basicSalary)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#22c55e' }}>{s.additions > 0 ? '+' + fmt(s.additions) : '-'}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#ef4444' }}>{s.deductions > 0 ? '-' + fmt(s.deductions) : '-'}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(s.netSalary)}</td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
