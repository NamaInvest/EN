'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

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
    const { t } = useTranslation();
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
            showToast(t('sys.str_2505')); 
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
                if (res.ok) { showToast(t('sys.str_2506')); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            } else {
                const res = await fetch('/api/settings/approvals', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body,
                });
                if (res.ok) { showToast(t('sys.str_2507')); setShowModal(false); fetchData(); }
                else { const d = await res.json(); showToast(`❌ ${d.error}`); }
            }
        } catch { showToast(t('sys.str_419')); }
    };

    const deleteRule = async (r: ApprovalRule) => {
        if (!confirm(t('sys.str_2512'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/settings/approvals/${r.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { showToast(t('sys.str_488')); fetchData(); }
            else { const d = await res.json(); showToast(`❌ ${d.error}`); }
        } catch { showToast(t('sys.str_419')); }
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
                <h1 className="page-title">{t('sys.str_1307')}</h1>
                <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_2484')}</button>
            </div>

            <div className="page-content animate-fade-in">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t('sys.str_2485')}</th>
                                <th>{t('sys.str_2486')}</th>
                                <th>{t('sys.str_2487')}</th>
                                <th>{t('sys.str_2488')}</th>
                                <th>{t('sys.str_2489')}</th>
                                <th>{t('fin.str_227')}</th>
                                <th>{t('sys.str_435')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                                : rules.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{t('sys.str_2490')}</div></div></td></tr>
                                    : rules.map((r, i) => (
                                        <tr key={r.id}>
                                            <td>{i + 1}</td>
                                            <td style={{ fontWeight: 'bold' }}>{getDocTypeName(r.documentType)}</td>
                                            <td dir="ltr" style={{ color: 'var(--success)' }}>{r.minAmount > 0 ? r.minAmount?.toLocaleString() : t('sys.str_2508')}</td>
                                            <td dir="ltr" style={{ color: 'var(--danger)' }}>{r.maxAmount ? r.maxAmount?.toLocaleString() : t('sys.str_2509')}</td>
                                            <td><span className="badge badge-outline">{r.level}</span></td>
                                            <td><span className="badge badge-primary">{r.approverRole}</span></td>
                                            <td>
                                                <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {r.isActive ? t('sys.str_2510') : t('sys.str_654')}
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
                            <div className="modal-title">{editId ? t('sys.str_2511') : t('sys.str_2484')}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_2491')}</label>
                            <select className="input" value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })}>
                                <option value="PURCHASE_ORDER">{t('sys.str_2492')}</option>
                                <option value="JOURNAL_ENTRY">{t('sys.str_2493')}</option>
                                <option value="EXPENSE">{t('sys.str_2494')}</option>
                                <option value="MANUFACTURING_ORDER">{t('sys.str_2495')}</option>
                                <option value="SALES_INVOICE">{t('sys.str_2496')}</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_2497')}</label>
                                <input className="input" type="number" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: parseFloat(e.target.value) || 0 })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_2498')}</label>
                                <input className="input" type="number" value={form.maxAmount || ''} onChange={e => setForm({ ...form, maxAmount: e.target.value ? parseFloat(e.target.value) : null })} dir="ltr" placeholder={t('sys.str_514')} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_2499')}</label>
                                <select className="input" value={form.approverRole} onChange={e => setForm({ ...form, approverRole: e.target.value })}>
                                    <option value="admin">{t('sys.str_2500')}</option>
                                    <option value="manager">{t('sys.str_2501')}</option>
                                    <option value="accountant">{t('sys.str_2502')}</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_2503')}</label>
                                <input className="input" type="number" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })} dir="ltr" min="1" />
                            </div>
                        </div>

                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                            <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>{t('sys.str_2504')}</label>
                        </div>


                        <div className="modal-footer" style={{ marginTop: '20px' }}>
                            <button className="btn btn-primary" onClick={handleSave}>{t('sys.str_484')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
