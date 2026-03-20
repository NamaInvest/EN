'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking { id: number; bookingNo: number; date: string; total: number; deposit: number; status: string; notes: string; customerId: number; customer?: { name: string } }
interface Customer { id: number; name: string }

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ total: '', deposit: '', notes: '', customerId: '', date: '' });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const getToken = () => localStorage.getItem('token') || '';

    useEffect(() => { load(); loadCustomers(); }, []);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${getToken()}` } });
            if (r.ok) setBookings(await r.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    async function loadCustomers() {
        try {
            const r = await fetch('/api/customers', { headers: { Authorization: `Bearer ${getToken()}` } });
            if (r.ok) { const data = await r.json(); setCustomers(Array.isArray(data) ? data : data.customers || []); }
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify(form),
        });
        if (res.ok) { setShowAdd(false); setForm({ total: '', deposit: '', notes: '', customerId: '', date: '' }); load(); }
    };

    const updateStatus = async (id: number, status: string) => {
        await fetch('/api/bookings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ id, status }),
        });
        load();
    };

    const convertToInvoice = async (bookingId: number) => {
        if (!confirm('هل أنت متأكد من سحب المبلغ المتبقي وإصدار فاتورة مبيعات؟')) return;
        const res = await fetch('/api/bookings/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ bookingId }),
        });
        if (res.ok) {
            alert('تم إصدار الفاتورة بنجاح!');
            load();
            router.push('/sales');
        } else {
            const err = await res.json();
            alert(err.error || 'فشل توليد الفاتورة');
        }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });
    const statusLabel: Record<string, string> = { pending: '⏳ قيد الانتظار', confirmed: '✅ مؤكد', completed: '🏁 مكتمل', invoiced: '🧾 مفوتر', cancelled: '❌ ملغي' };
    const statusColor: Record<string, string> = { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#22c55e', invoiced: '#8b5cf6', cancelled: '#ef4444' };

    return (<><div className="page-header"><h1 className="page-title">📅 الحجوزات</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{bookings.length} حجز</span>
                <div className="toolbar-spacer" />
                <button className="btn" onClick={() => router.push('/bookings/calendar')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>🗓️ عرض التقويم</button>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ حجز جديد</button>
            </div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '16px' }}>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>العميل</label><select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} style={{ width: '160px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}>
                    <option value="">-- اختر عميل --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>تاريخ الحجز</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '150px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} dir="ltr" /></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>المبلغ</label><input type="number" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} dir="ltr" /></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>العربون</label><input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} dir="ltr" /></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ملاحظات</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '200px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} /></div>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>حفظ</button><button className="btn btn-sm" onClick={() => setShowAdd(false)}>إلغاء</button>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                    bookings.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">لا توجد حجوزات</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>#</th><th style={{ padding: '8px', textAlign: 'right' }}>العميل</th><th style={{ padding: '8px', textAlign: 'right' }}>التاريخ</th><th style={{ padding: '8px', textAlign: 'right' }}>المبلغ</th><th style={{ padding: '8px', textAlign: 'right' }}>العربون</th><th style={{ padding: '8px', textAlign: 'right' }}>الحالة</th><th style={{ padding: '8px' }}>إجراء</th></tr></thead>
                            <tbody>{bookings.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{b.bookingNo}</td>
                                    <td style={{ padding: '8px', fontSize: '13px' }}>{b.customer?.name || '-'}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(b.date).toLocaleDateString('ar-SA')}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(b.total)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(b.deposit)}</td>
                                    <td style={{ padding: '8px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: (statusColor[b.status] || '#888') + '15', color: statusColor[b.status] || '#888' }}>{statusLabel[b.status] || b.status}</span></td>
                                    <td style={{ padding: '8px' }}>
                                        {b.status === 'pending' && <><button className="btn btn-sm" onClick={() => updateStatus(b.id, 'confirmed')} style={{ fontSize: '11px', marginLeft: '4px' }}>✅</button><button className="btn btn-sm" onClick={() => updateStatus(b.id, 'cancelled')} style={{ fontSize: '11px' }}>❌</button></>}
                                        {b.status === 'confirmed' && <button className="btn btn-sm" onClick={() => updateStatus(b.id, 'completed')} style={{ fontSize: '11px' }}>🏁</button>}
                                        {b.status === 'completed' && <button className="btn btn-sm" onClick={() => convertToInvoice(b.id)} style={{ fontSize: '11px', background: '#6366f1', color: '#fff' }}>🧾 إصدار فاتورة مبيعات</button>}
                                        {b.status === 'invoiced' && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مكتمل الفوترة</span>}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
