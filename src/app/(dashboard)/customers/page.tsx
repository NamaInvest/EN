'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Customer {
    id: number; name: string; phone: string; type: number; balance: number;
    address: string; city: string; district: string; taxNumber: string; crNo: string;
    creditLimit: number; notes: string; buildingNumber: string;
    postalCode: string; street: string; active: boolean; routeId: number | null;
}

export default function CustomersPage() {
    const { t } = useTranslation();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<any[]>([]);
    const [form, setForm] = useState({
        name: '', phone: '', type: '0', address: '', street: '', buildingNumber: '',
        district: '', city: '', postalCode: '', creditLimit: '0', taxNumber: '', crNo: '', notes: '', routeId: ''
    });
    const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);

    async function fetchData() {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (typeFilter) params.set('type', typeFilter);
            const [cRes, rRes] = await Promise.all([
                fetch(`/api/customers?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/sales/routes`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (cRes.ok) setCustomers(await cRes.json());
            if (rRes.ok) setRoutes(await rRes.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t); }, [search, typeFilter]);

    const typeLabel = (t: number) => t === 0 ? t('sys.str_532') : t === 1 ? t('sys.str_533') : t('sys.str_525');
    const typeBadge = (t: number) => t === 0 ? 'badge-info' : t === 1 ? 'badge-purple' : 'badge-warning';

    const openAdd = () => {
        setEditItem(null);
        setForm({
            name: '', phone: '', type: '0', address: '', street: '', buildingNumber: '',
            district: '', city: '', postalCode: '', creditLimit: '0', taxNumber: '', crNo: '', notes: '', routeId: ''
        });
        setShowModal(true);
    };

    const openEdit = (c: Customer) => {
        setEditItem(c);
        setForm({
            name: c.name, phone: c.phone || '', type: c.type.toString(), address: c.address || '',
            street: c.street || '', buildingNumber: c.buildingNumber || '', district: c.district || '',
            city: c.city || '', postalCode: c.postalCode || '', creditLimit: c.creditLimit?.toString() || '0',
            taxNumber: c.taxNumber || '', crNo: c.crNo || '', notes: c.notes || '', routeId: c.routeId?.toString() || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const url = editItem ? `/api/customers/${editItem.id}` : '/api/customers';
        const method = editItem ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) { setShowModal(false); fetchData(); }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_541'))) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const sendReminder = async (c: Customer) => {
        if (!c.phone) {
            alert(t('sys.str_542'));
            return;
        }
        setSendingReminderId(c.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/crm/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phone: c.phone, type: 'reminder', balance: fmt(c.balance) })
            });
            const data = await res.json();
            if (data.success) {
                alert(t('sys.str_543'));
            } else {
                alert(`❌ فشل الإرسال: ${data.error}`);
            }
        } catch (err) {
            alert(t('sys.str_544'));
        } finally {
            setSendingReminderId(null);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('sys.str_521')}</h1>
                <span className="badge badge-info">{customers.length}</span>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar">
                        <input className="input" placeholder={t('sys.str_545')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="input" style={{ width: '150px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">{t('sys.str_522')}</option>
                        <option value="0">{t('sys.str_523')}</option>
                        <option value="1">{t('sys.str_524')}</option>
                        <option value="2">{t('sys.str_525')}</option>
                    </select>
                    <div className="toolbar-spacer" />
                    <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_526')}</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>{t('fin.str_198')}</th><th>{t('sys.str_527')}</th><th>{t('fin.str_199')}</th><th>{t('sys.str_528')}</th><th>{t('fin.str_234')}</th><th>{t('sys.str_529')}</th><th>{t('sys.str_530')}</th><th>{t('sys.str_435')}</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">{t('fin.str_238')}</div></div></td></tr>
                            ) : customers.map((c, i) => (
                                <tr key={c.id}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                                    <td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                                    <td><span className={`badge ${typeBadge(c.type)}`}>{typeLabel(c.type)}</span></td>
                                    <td>{c.city || '-'}</td>
                                    <td style={{ fontWeight: '600', color: c.balance > 0 ? 'var(--danger-light)' : 'var(--success-light)' }}>{fmt(c.balance)} {t('sys.str_68')}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.taxNumber || '-'}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.crNo || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {c.balance > 0 && (
                                                <button className="btn btn-sm" 
                                                    style={{ background: '#25D366', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' }}
                                                    onClick={() => sendReminder(c)}
                                                    disabled={sendingReminderId === c.id}
                                                    title={t('sys.str_546')}>
                                                    {sendingReminderId === c.id ? '⏳' : '💬'}
                                                </button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editItem ? t('sys.str_547') : t('sys.str_548')}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="grid-2">
                            <div className="input-group"><label className="input-label">{t('sys.str_531')}</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_527')}</label>
                                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('fin.str_199')}</label>
                                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="0">{t('sys.str_532')}</option><option value="1">{t('sys.str_533')}</option><option value="2">{t('sys.str_525')}</option></select></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_534')}</label>
                                <select className="input" value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })}>
                                    <option value="">{t('sys.str_535')}</option>
                                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label className="input-label">{t('sys.str_528')}</label>
                                <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_536')}</label>
                                <input className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_537')}</label>
                                <input className="input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_538')}</label>
                                <input className="input" value={form.buildingNumber} onChange={e => setForm({ ...form, buildingNumber: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_539')}</label>
                                <input className="input" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_529')}</label>
                                <input className="input" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_530')}</label>
                                <input className="input" value={form.crNo} onChange={e => setForm({ ...form, crNo: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">{t('sys.str_540')}</label>
                                <input className="input" type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="input-group"><label className="input-label">{t('sys.str_465')}</label>
                            <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>{t('sys.str_455')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
