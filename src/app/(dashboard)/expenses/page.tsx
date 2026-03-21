'use client';

import { useState, useEffect } from 'react';

interface Expense { id: number; date: string; category: string; description: string; amount: number; notes: string; costCenterId?: number; costCenter?: { name: string } }

const CATEGORIES = ['إيجار', 'كهرباء', 'ماء', 'صيانة', 'رواتب', 'مواصلات', 'إعلانات', 'مشتريات متنوعة', 'أخرى'];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [form, setForm] = useState({ category: 'أخرى', description: '', amount: '', notes: '', costCenterId: '' });
    const [editId, setEditId] = useState<number | null>(null);
    const [canDelete, setCanDelete] = useState(false);
    const [canDeleteAll, setCanDeleteAll] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [toast, setToast] = useState('');
    const [costCenters, setCostCenters] = useState<{id:number, name:string, isActive:boolean}[]>([]);

    async function fetchData() {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        try {
            const res = await fetch(`/api/expenses?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setExpenses(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        fetch('/api/accounting/cost-centers').then(r => r.json()).then(d => setCostCenters(Array.isArray(d) ? d : [])).catch(() => {});
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
            const isAdmin = u.role === 'admin';
            setCanDelete(isAdmin || perms.includes('delete_expense'));
            setCanDeleteAll(isAdmin || perms.includes('delete_all_expenses'));
            setCanEdit(isAdmin || perms.includes('edit_expense'));
        } catch { }
    }, [dateFrom, dateTo]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            if (editId) {
                // Edit existing expense
                const res = await fetch('/api/expenses', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ id: editId, ...form, amount: parseFloat(form.amount), userId: user.id }),
                });
                if (res.ok) { showToast('✅ تم تعديل المصروف'); setShowModal(false); setEditId(null); setForm({ category: 'أخرى', description: '', amount: '', notes: '', costCenterId: '' }); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل التعديل'}`); }
            } else {
                // Add new expense
                const res = await fetch('/api/expenses', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ ...form, amount: parseFloat(form.amount), userId: user.id }),
                });
                if (res.ok) { showToast('✅ تم إضافة المصروف'); setShowModal(false); setForm({ category: 'أخرى', description: '', amount: '', notes: '', costCenterId: '' }); fetchData(); }
            }
        } catch (err) { console.error(err); }
    };

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const deleteExpense = async (e: Expense) => {
        if (!confirm(`هل أنت متأكد من حذف المصروف "${e.description}"؟`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/expenses?id=${e.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { showToast('✅ تم حذف المصروف'); fetchData(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل'}`); }
        } catch { showToast('❌ خطأ'); }
    };

    const deleteAllExpenses = async () => {
        if (!confirm(`⚠️ هل أنت متأكد من حذف جميع المصروفات (${expenses.length} مصروف)؟\n\nهذا الإجراء لا يمكن التراجع عنه!`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/expenses?all=true', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); fetchData(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل'}`); }
        } catch { showToast('❌ خطأ'); }
    };

    const editExpense = (e: Expense) => {
        setEditId(e.id);
        setForm({ category: e.category, description: e.description, amount: String(e.amount), notes: e.notes || '', costCenterId: String(e.costCenterId || '') });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditId(null);
        setForm({ category: 'أخرى', description: '', amount: '', notes: '', costCenterId: '' });
        setShowModal(true);
    };

    return (
        <>
            <div className="page-header"><h1 className="page-title">💸 المصروفات</h1></div>
            <div className="page-content animate-fade-in">
                <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                    <div className="kpi-card danger" style={{ gridColumn: 'span 2' }}>
                        <div className="kpi-icon">💸</div>
                        <div className="kpi-value">{fmt(totalExpenses)} ر.س</div>
                        <div className="kpi-label">إجمالي المصروفات</div>
                    </div>
                </div>
                <div className="toolbar">
                    <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} dir="ltr" />
                    <div className="toolbar-spacer" />
                    {canDeleteAll && expenses.length > 0 && (
                        <button className="btn btn-ghost" onClick={deleteAllExpenses} style={{ color: 'var(--danger)', border: '1px solid var(--danger)', marginLeft: '8px' }}>
                            🗑️ حذف الكل ({expenses.length})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={openAddModal}>➕ إضافة مصروف</button>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>التاريخ</th><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>مركز تسجيل</th><th>ملاحظات</th>{(canDelete || canEdit) && <th>إجراءات</th>}</tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={(canDelete || canEdit) ? 8 : 7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : expenses.length === 0 ? <tr><td colSpan={(canDelete || canEdit) ? 8 : 7}><div className="empty-state"><div className="empty-state-icon">💸</div><div className="empty-state-text">لا توجد مصروفات</div></div></td></tr>
                                    : expenses.map((e, i) => (
                                        <tr key={e.id}><td>{i + 1}</td><td>{new Date(e.date).toLocaleDateString('ar-SA')}</td>
                                            <td><span className="badge badge-warning">{e.category}</span></td>
                                            <td>{e.description}</td><td style={{ fontWeight: '700', color: 'var(--danger-light)' }}>{fmt(e.amount)} ر.س</td>
                                            <td><span className="badge" style={{background:'#eef2ff', color:'#4f46e5'}}>{e.costCenter?.name || '-'}</span></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{e.notes || '-'}</td>
                                            {(canDelete || canEdit) && <td style={{ display: 'flex', gap: '4px' }}>
                                                {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => editExpense(e)} style={{ color: 'var(--primary)', fontSize: '12px' }}>✏️</button>}
                                                {canDelete && <button className="btn btn-ghost btn-sm" onClick={() => deleteExpense(e)} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️</button>}
                                            </td>}
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><div className="modal-title">{editId ? '✏️ تعديل مصروف' : '➕ إضافة مصروف'}</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="input-group"><label className="input-label">الفئة</label>
                            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="input-group"><label className="input-label">مركز التكلفة (اختياري)</label>
                            <select className="input" value={form.costCenterId} onChange={e => setForm({ ...form, costCenterId: e.target.value })}>
                                <option value="">بدون مركز (عام)</option>
                                {costCenters.filter(c => c.isActive || String(c.id) === form.costCenterId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select></div>
                        <div className="input-group"><label className="input-label">الوصف *</label>
                            <textarea className="input" value={form.description} onInput={e => setForm({ ...form, description: (e.target as HTMLTextAreaElement).value })} placeholder="وصف المصروف" rows={2} dir="rtl" /></div>
                        <div className="input-group"><label className="input-label">المبلغ *</label>
                            <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" dir="ltr" /></div>
                        <div className="input-group"><label className="input-label">ملاحظات</label>
                            <textarea className="input" value={form.notes} onInput={e => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} rows={2} dir="rtl" /></div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>💾 {editId ? 'تحديث' : 'حفظ'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button></div>
                    </div>
                </div>
            )}
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
