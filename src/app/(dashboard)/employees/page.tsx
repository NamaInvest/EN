'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Employee { id: number; name: string; phone: string; position: string; salary: number; startDate: string; active: boolean; branchId?: number; branch?: { id: number; name: string } | null; housingAllowance?: number; transportAllowance?: number; otherAllowance?: number; bankName?: string; iban?: string; }

export default function EmployeesPage() {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Employee | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '', position: '', salary: '', startDate: '', branchId: '', housingAllowance: '', transportAllowance: '', otherAllowance: '', bankName: '', iban: '' });

    async function fetchData() {
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

    const openAdd = () => { setEditItem(null); setForm({ name: '', phone: '', position: '', salary: '', startDate: '', branchId: '', housingAllowance: '', transportAllowance: '', otherAllowance: '', bankName: '', iban: '' }); setShowModal(true); };
    const openEdit = (e: Employee) => { setEditItem(e); setForm({ name: e.name, phone: e.phone || '', position: e.position || '', salary: e.salary?.toString() || '', startDate: e.startDate || '', branchId: e.branchId?.toString() || '', housingAllowance: e.housingAllowance?.toString() || '', transportAllowance: e.transportAllowance?.toString() || '', otherAllowance: e.otherAllowance?.toString() || '', bankName: e.bankName || '', iban: e.iban || '' }); setShowModal(true); };

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
        if (!confirm(t('hr.str_567'))) return;
        const token = localStorage.getItem('token');
        try { await fetch(`/api/employees/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchData(); } catch (err) { console.error(err); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    return (
        <>
            <div className="page-header"><h1 className="page-title">{t('hr.str_553')}</h1><span className="badge badge-info">{employees.length} {t('hr.str_554')}</span></div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar"><input className="input" placeholder={t('hr.str_568')} value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <div className="toolbar-spacer" />
                    <button className="btn btn-primary" onClick={openAdd}>{t('hr.str_555')}</button>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>{t('fin.str_198')}</th><th>{t('sys.str_527')}</th><th>{t('hr.str_556')}</th><th>{t('hr.str_557')}</th><th>{t('hr.str_558')}</th><th>{t('sys.str_506')}</th><th>{t('fin.str_227')}</th><th>{t('sys.str_435')}</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                                : employees.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👨‍💼</div><div className="empty-state-text">{t('hr.str_559')}</div></div></td></tr>
                                    : employees.map((e, i) => (
                                        <tr key={e.id}><td>{i + 1}</td><td style={{ fontWeight: '600' }}>{e.name}</td><td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{e.phone || '-'}</td>
                                            <td><span className="badge badge-outline">{e.branch?.name || '-'}</span></td>
                                            <td><span className="badge badge-purple">{e.position || '-'}</span></td>
                                            <td style={{ fontWeight: '600' }}>{fmt(e.salary)} {t('sys.str_68')}</td>
                                            <td>{e.startDate || '-'}</td>
                                            <td><span className="status-dot active" /> {t('sys.str_180')}</td>
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
                            <div className="input-group"><label className="input-label">{t('sys.str_531')}</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_527')}</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
                            <div className="input-group">
                                <label className="input-label">{t('hr.str_556')}</label>
                                <select className="input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                                    <option value="">{t('hr.str_560')}</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group"><label className="input-label">{t('hr.str_557')}</label><input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_561')}</label><input className="input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_562')}</label><input className="input" type="number" value={form.housingAllowance} onChange={e => setForm({ ...form, housingAllowance: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_563')}</label><input className="input" type="number" value={form.transportAllowance} onChange={e => setForm({ ...form, transportAllowance: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_564')}</label><input className="input" type="number" value={form.otherAllowance} onChange={e => setForm({ ...form, otherAllowance: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_565')}</label><input className="input" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('hr.str_566')}</label><input className="input" value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_506')}</label><input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-primary" onClick={handleSave}>{t('sys.str_455')}</button><button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button></div>
                    </div>
                </div>
            )}
        </>
    );
}
