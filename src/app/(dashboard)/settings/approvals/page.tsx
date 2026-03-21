'use client';

import { useState, useEffect } from 'react';

interface ApprovalRule {
    id: number;
    documentType: string;
    minAmount: number;
    maxAmount: number | null;
    approverRole: string;
    approverId: number | null;
    level: number;
    isActive: boolean;
    approver?: {
        id: number;
        fullName: string;
        role: string;
    };
}

export default function ApprovalsPage() {
    const [rules, setRules] = useState<ApprovalRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ documentType: 'PURCHASE_ORDER', minAmount: 0, maxAmount: null as number | null, approverRole: 'admin', approverId: null as number | null, level: 1, isActive: true });
    const [editId, setEditId] = useState<number | null>(null);
    const [toast, setToast] = useState('');

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/settings/approvals', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setRules(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleSave = async () => {
        if (!form.documentType || !form.approverRole) { 
            showToast('❌ يرجى اختيار نوع المستند ودور المعتمِد'); 
            return; 
        }
        
        const token = localStorage.getItem('token');
        try {
            const body = JSON.stringify({ ...form, maxAmount: form.maxAmount || null });
            if (editId) {
                const res = await fetch(`/api/settings/approvals/${editId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body,
                });
                if (res.ok) { showToast('✅ تم تحديث القاعدة'); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            } else {
                const res = await fetch('/api/settings/approvals', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body,
                });
                if (res.ok) { showToast('✅ تمت إضافة القاعدة'); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const deleteRule = async (r: ApprovalRule) => {
        if (!confirm(`هل أنت متأكد من حذف هذه القاعدة؟`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/settings/approvals/${r.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { showToast('✅ تم الحذف'); fetchData(); }
            else { const d = await res.json(); showToast(`❌ ${d.error}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const openEdit = (r: ApprovalRule) => {
        setEditId(r.id);
        setForm({ 
            documentType: r.documentType, 
            minAmount: r.minAmount, 
            maxAmount: r.maxAmount, 
            approverRole: r.approverRole, 
            approverId: r.approverId, 
            level: r.level, 
            isActive: r.isActive 
        });
        setShowModal(true);
    };

    const openAdd = () => {
        setEditId(null);
        setForm({ documentType: 'PURCHASE_ORDER', minAmount: 0, maxAmount: null, approverRole: 'admin', approverId: null, level: 1, isActive: true });
        setShowModal(true);
    };

    const getDocTypeName = (type: string) => {
        const map: Record<string, string> = {
            'PURCHASE_ORDER': 'طلب / أمر شراء',
            'JOURNAL_ENTRY': 'قيد يومية',
            'MANUFACTURING_ORDER': 'أمر تصنيع',
            'EXPENSE': 'مصروف / عهدة',
            'SALES_INVOICE': 'فاتورة مبيعات'
        };
        return map[type] || type;
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">✅ نظام الرقابة والموافقات</h1>
                <button className="btn btn-primary" onClick={openAdd}>➕ إضافة قاعدة موافقة</button>
            </div>

            <div className="page-content animate-fade-in">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>نوع المستند</th>
                                <th>الحد الأدنى للمبلغ</th>
                                <th>الحد الأعلى للمبلغ</th>
                                <th>المستوى</th>
                                <th>دور المعتمِد</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : rules.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">لا توجد قواعد موافقة مسجلة</div></div></td></tr>
                                    : rules.map((r, i) => (
                                        <tr key={r.id}>
                                            <td>{i + 1}</td>
                                            <td style={{ fontWeight: 'bold' }}>{getDocTypeName(r.documentType)}</td>
                                            <td dir="ltr" style={{ color: 'var(--success)' }}>{r.minAmount > 0 ? r.minAmount?.toLocaleString() : 'أي مبلغ'}</td>
                                            <td dir="ltr" style={{ color: 'var(--danger)' }}>{r.maxAmount ? r.maxAmount?.toLocaleString() : 'مفتوح (لا يوجد حد)'}</td>
                                            <td><span className="badge badge-outline">{r.level}</span></td>
                                            <td><span className="badge badge-primary">{r.approverRole}</span></td>
                                            <td>
                                                <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {r.isActive ? 'نشطة' : 'موقوفة'}
                                                </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteRule(r)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editId ? '✏️ تعديل قاعدة موافقة' : '➕ إضافة قاعدة موافقة'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        
                        <div className="input-group">
                            <label className="input-label">نوع المستند *</label>
                            <select className="input" value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })}>
                                <option value="PURCHASE_ORDER">طلب / أمر شراء</option>
                                <option value="JOURNAL_ENTRY">قيد يومية (سند)</option>
                                <option value="EXPENSE">مصروفات وعهد</option>
                                <option value="MANUFACTURING_ORDER">أمر تصنيع مخزني</option>
                                <option value="SALES_INVOICE">فاتورة مبيعات</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label className="input-label">الحد الأدنى للقيمة (0 = أي مبلغ)</label>
                                <input className="input" type="number" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: parseFloat(e.target.value) || 0 })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">الحد الأعلى (اتركه فارغاً = بدون حد)</label>
                                <input className="input" type="number" value={form.maxAmount || ''} onChange={e => setForm({ ...form, maxAmount: e.target.value ? parseFloat(e.target.value) : null })} dir="ltr" placeholder="مفتوح" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label className="input-label">دور المعتمِد المطلوب *</label>
                                <select className="input" value={form.approverRole} onChange={e => setForm({ ...form, approverRole: e.target.value })}>
                                    <option value="admin">المدير العام (admin)</option>
                                    <option value="manager">مدير القسم (manager)</option>
                                    <option value="accountant">محاسب (accountant)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">مستوى الموافقة (للعمليات المعقدة)</label>
                                <input className="input" type="number" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })} dir="ltr" min="1" />
                            </div>
                        </div>

                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                            <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>تفعيل القاعدة ضمن دورة العمل</label>
                        </div>


                        <div className="modal-footer" style={{ marginTop: '20px' }}>
                            <button className="btn btn-primary" onClick={handleSave}>💾 احفظ التغييرات</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
