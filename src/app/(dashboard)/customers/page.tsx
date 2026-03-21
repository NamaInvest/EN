'use client';

import { useState, useEffect } from 'react';

interface Customer {
    id: number; name: string; phone: string; type: number; balance: number;
    address: string; city: string; district: string; taxNumber: string; crNo: string;
    creditLimit: number; notes: string; buildingNumber: string;
    postalCode: string; street: string; active: boolean; routeId: number | null;
}

export default function CustomersPage() {
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

    const typeLabel = (t: number) => t === 0 ? 'عميل' : t === 1 ? 'مورد' : 'كلاهما';
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
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const sendReminder = async (c: Customer) => {
        if (!c.phone) {
            alert('العميل لا يملك رقم هاتف مسجل');
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
                alert('✅ تم إرسال رسالة التذكير بنجاح');
            } else {
                alert(`❌ فشل الإرسال: ${data.error}`);
            }
        } catch (err) {
            alert('❌ خطأ في الاتصال بالخادم');
        } finally {
            setSendingReminderId(null);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">👥 العملاء والموردين</h1>
                <span className="badge badge-info">{customers.length}</span>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar">
                        <input className="input" placeholder="🔍 بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="input" style={{ width: '150px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">الكل</option>
                        <option value="0">عملاء</option>
                        <option value="1">موردين</option>
                        <option value="2">كلاهما</option>
                    </select>
                    <div className="toolbar-spacer" />
                    <button className="btn btn-primary" onClick={openAdd}>➕ إضافة</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>النوع</th><th>المدينة</th><th>الرصيد</th><th>الرقم الضريبي</th><th>السجل التجاري</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">لا توجد بيانات</div></div></td></tr>
                            ) : customers.map((c, i) => (
                                <tr key={c.id}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                                    <td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                                    <td><span className={`badge ${typeBadge(c.type)}`}>{typeLabel(c.type)}</span></td>
                                    <td>{c.city || '-'}</td>
                                    <td style={{ fontWeight: '600', color: c.balance > 0 ? 'var(--danger-light)' : 'var(--success-light)' }}>{fmt(c.balance)} ر.س</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.taxNumber || '-'}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.crNo || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {c.balance > 0 && (
                                                <button className="btn btn-sm" 
                                                    style={{ background: '#25D366', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' }}
                                                    onClick={() => sendReminder(c)}
                                                    disabled={sendingReminderId === c.id}
                                                    title="إرسال تذكير بالمديونية عبر الواتساب">
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
                            <div className="modal-title">{editItem ? '✏️ تعديل' : '➕ إضافة جديد'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="grid-2">
                            <div className="input-group"><label className="input-label">الاسم *</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الهاتف</label>
                                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">النوع</label>
                                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="0">عميل</option><option value="1">مورد</option><option value="2">كلاهما</option></select></div>
                            <div className="input-group"><label className="input-label">خط السير (توزيع المبيعات)</label>
                                <select className="input" value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })}>
                                    <option value="">غير معين لخط سير</option>
                                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label className="input-label">المدينة</label>
                                <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الحي</label>
                                <input className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الشارع</label>
                                <input className="input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">رقم المبنى</label>
                                <input className="input" value={form.buildingNumber} onChange={e => setForm({ ...form, buildingNumber: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">الرمز البريدي</label>
                                <input className="input" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">الرقم الضريبي</label>
                                <input className="input" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">السجل التجاري</label>
                                <input className="input" value={form.crNo} onChange={e => setForm({ ...form, crNo: e.target.value })} dir="ltr" /></div>
                            <div className="input-group"><label className="input-label">حد الائتمان</label>
                                <input className="input" type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="input-group"><label className="input-label">ملاحظات</label>
                            <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
