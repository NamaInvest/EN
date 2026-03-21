'use client';
import { useState, useEffect } from 'react';

interface Route {
    id: number;
    name: string;
    description: string;
    active: boolean;
    salesRepId: number | null;
    salesRep: { id: number, name: string } | null;
    _count?: { customers: number };
}

export default function RoutesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ name: '', description: '', salesRepId: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [rtRes, empRes] = await Promise.all([
                fetch('/api/sales/routes', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } }) // Fetching humans as reps
            ]);
            if (rtRes.ok) setRoutes(await rtRes.json());
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
            const res = await fetch('/api/sales/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ name: '', description: '', salesRepId: '' });
                loadData();
            } else {
                alert('فشل حفظ خط السير');
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">🗺️ خطوط السير للمبيعات (Sales Routes)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{routes.length} خط سير مسجل</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">➕ إضافة خط سير جديد</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الخط</th>
                            <th>اسم/منطقة خط السير</th>
                            <th>الوصف</th>
                            <th>المندوب المسؤول</th>
                            <th>عدد العملاء المربوطين</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : routes.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد خطوط سير</td></tr> : routes.map(r => (
                            <tr key={r.id}>
                                <td><strong>R-{r.id}</strong></td>
                                <td>{r.name}</td>
                                <td>{r.description || '-'}</td>
                                <td>{r.salesRep?.name || <span style={{color: '#f59e0b'}}>لم يحدد</span>}</td>
                                <td>
                                    <span style={{ padding: '2px 8px', backgroundColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {r._count?.customers || 0} عميل
                                    </span>
                                </td>
                                <td>
                                    {r.active ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>نشط</span> : <span style={{ color: '#ef4444' }}>موقوف</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal */}
        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal" style={{ maxWidth: '500px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>إنشاء خط سير جديد</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">اسم خط السير (مثل: مسار شرق الرياض)</label>
                            <input required className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">وصف مسار الخط</label>
                            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">المندوب المسؤول (اختياري)</label>
                            <select className="input" value={form.salesRepId} onChange={e => setForm({...form, salesRepId: e.target.value})}>
                                <option value="">بدون مندوب (مسار شاغر)</option>
                                {employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" className="btn btn-primary">💾 حفظ واعتماد</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
