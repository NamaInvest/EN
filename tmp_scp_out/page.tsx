'use client';

import { useState, useEffect } from 'react';

interface Employee { id: number; name: string; phone: string; position: string; salary: number; startDate: string; active: boolean; branchId?: number; branch?: { id: number; name: string } | null; }

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Employee | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '', position: '', salary: '', startDate: '', branchId: '' });

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const params = search ? `?search=${search}` : '';
        try {
            const [empRes, bRes] = await Promise.all([
                fetch(`/api/employees${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                branches.length === 0 ? fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
            ]);
            if (empRes.ok) setEmployees(await empRes.json());
            if (bRes && bRes.ok) setBranches(await bRes.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t); }, [search]);

    const openAdd = () => { setEditItem(null); setForm({ name: '', phone: '', position: '', salary: '', startDate: '', branchId: '' }); setShowModal(true); };
    const openEdit = (e: Employee) => { setEditItem(e); setForm({ name: e.name, phone: e.phone || '', position: e.position || '', salary: e.salary?.toString() || '', startDate: e.startDate || '', branchId: e.branchId?.toString() || '' }); setShowModal(true); };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const url = editItem ? `/api/employees/${editItem.id}` : '/api/employees';
        const method = editItem ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد؟')) return;
        const token = localStorage.getItem('token');
        try { await fetch(`/api/employees/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchData(); } catch (err) { console.error(err); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    return (
        <>
            <div className="page-header"><h1 className="page-title">👨‍💼 الموظفين</h1><span className="badge badge-info">{employees.length} موظف</span></div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar"><input className="input" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <div className="toolbar-spacer" />
                    <button className="btn btn-primary" onClick={openAdd}>➕ إضافة موظف</button>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>الفرع</th><th>الوظيفة</th><th>الراتب</th><th>تاريخ البداية</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : employees.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👨‍💼</div><div className="empty-state-text">لا يوجد موظفين</div></div></td></tr>
                                    : employees.map((e, i) => (
                                        <tr key={e.id}><td>{i + 1}</td><td style={{ fontWeight: '600' }}>{e.name}</td><td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{e.phone || '-'}</td>
                                            <td><span className="badge badge-outline">{e.branch?.name || '-'}</span></td>
                                            <td><span className="badge badge-purple">{e.position || '-'}</span></td>
                                            <td style={{ fontWeight: '600' }}>{fmt(e.salary)} ر.س</td>
                                            <td>{e.startDate || '-'}</td>
                                            <td><span className="status-dot active" /> نشط</td>
                                            <td><div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>✏️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(e.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                                            </div></td></tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><div className="modal-title">{editItem ? '✏️ تعديل' : '➕ إضافة موظف'}</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="grid-2">
                            <div className="input-group"><label className="input-label">الاسم *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الهاتف</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
                            <div className="input-group">
                                <label className="input-label">الفرع</label>
                                <select className="input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                                    <option value="">-- اختياري --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group"><label className="input-label">الوظيفة</label><input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الراتب</label><input className="input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">تاريخ البداية</label><input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
                    </div>
                </div>
            )}
        </>
    );
}
