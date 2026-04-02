'use client';

import { useState, useEffect } from 'react';

interface Shift {
    id: number;
    startTime: string;
    endTime: string | null;
    startCash: number;
    endCash: number | null;
    status: string;
    notes: string | null;
    user: { fullName: string };
    branch: { name: string } | null;
}

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ startCash: '', notes: '' });
    const [toast, setToast] = useState('');
    const [closingShift, setClosingShift] = useState<Shift | null>(null);
    const [closeForm, setCloseForm] = useState({ endCash: '', notes: '' });

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/shifts', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setShifts(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    const handleOpenShift = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            const res = await fetch('/api/shifts', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id, startCash: form.startCash, notes: form.notes }),
            });
            if (res.ok) {
                showToast('✅ تم فتح الوردية بنجاح');
                setShowModal(false);
                setForm({ startCash: '', notes: '' });
                fetchData();
            } else {
                const d = await res.json();
                showToast(`❌ ${d.error || 'فشل فتح الوردية'}`);
            }
        } catch {
            showToast('❌ حدث خطأ في الاتصال');
        }
    };

    const handleCloseShift = async () => {
        if (!closingShift) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/shifts', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: closingShift.id, endCash: closeForm.endCash, notes: closeForm.notes, status: 'closed' }),
            });
            if (res.ok) {
                showToast('✅ تم إغلاق الوردية');
                setClosingShift(null);
                setCloseForm({ endCash: '', notes: '' });
                fetchData();
            } else {
                const d = await res.json();
                showToast(`❌ ${d.error || 'فشل إغلاق الوردية'}`);
            }
        } catch {
            showToast('❌ حدث خطأ في الاتصال');
        }
    };

    const deleteShift = async (s: Shift) => {
        if (!confirm('هل أنت متأكد من حذف هذه الوردية؟ سيتم حذفها نهائياً.')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/shifts?id=${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { showToast('✅ تم حذف الوردية'); fetchData(); }
            else showToast('❌ فشل الحذف');
        } catch { showToast('❌ خطأ'); }
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">🕒 إدارة الورديات</h1>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ فتح وردية جديدة</button>
                </div>
            </div>

            <div className="page-content animate-fade-in">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>الموظف</th>
                                <th>الفرع</th>
                                <th>وقت الفتح</th>
                                <th>وقت الإغلاق</th>
                                <th>رصيد الافتتاح</th>
                                <th>رصيد الإغلاق</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : shifts.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">🕒</div><div className="empty-state-text">لا توجد ورديات</div></div></td></tr>
                                    : shifts.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 'bold' }}>{s.user?.fullName || 'غير معروف'}</td>
                                            <td><span className="badge badge-outline">{s.branch?.name || 'الفرع الرئيسي'}</span></td>
                                            <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(s.startTime).toLocaleString('ar-SA')}</td>
                                            <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--text-muted)' }}>{s.endTime ? new Date(s.endTime).toLocaleString('ar-SA') : '-'}</td>
                                            <td style={{ color: 'var(--primary)' }}>{fmt(s.startCash)} ر.س</td>
                                            <td style={{ color: s.endCash ? 'var(--success)' : 'var(--text-muted)' }}>{s.endCash !== null ? `${fmt(s.endCash)} ر.س` : '-'}</td>
                                            <td>
                                                <span className={`badge ${s.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                                                    {s.status === 'open' ? 'مفتوحة 🟢' : 'مغلقة 🔴'}
                                                </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '4px' }}>
                                                {s.status === 'open' && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => { setClosingShift(s); setCloseForm({ endCash: String(s.startCash), notes: s.notes || '' }) }} style={{ color: 'var(--danger)', fontSize: '13px', background: 'var(--danger-light)' }}>
                                                        إغلاق 🔒
                                                    </button>
                                                )}
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteShift(s)} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Opening Shift */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><div className="modal-title">➕ فتح وردية كاشير جديدة</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="input-group">
                            <label className="input-label">مبلغ العهدة الافتتاحي (في الدرج) *</label>
                            <input className="input" type="text" inputMode="decimal" value={form.startCash} onChange={e => setForm({ ...form, startCash: e.target.value })} placeholder="مثال: 500" dir="ltr" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">ملاحظات (اختياري)</label>
                            <textarea className="input" value={form.notes} onInput={e => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} rows={3} dir="rtl" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleOpenShift}>بدء الوردية 🚀</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Closing Shift */}
            {closingShift && (
                <div className="modal-overlay" onClick={() => setClosingShift(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><div className="modal-title">🔒 إغلاق وردية ({closingShift.user?.fullName})</div><button className="modal-close" onClick={() => setClosingShift(null)}>✕</button></div>
                        <div className="input-group" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>مبلغ الافتتاح:</span>
                                <span style={{ fontWeight: 'bold' }}>{fmt(closingShift.startCash)} ر.س</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                تأكد من إدخال المبلغ الفعلي الموجود في الدرج حالياً لتسوية العهدة بنجاح.
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">المبلغ الفعلي في الدرج (النهاية) *</label>
                            <input className="input" type="text" inputMode="decimal" value={closeForm.endCash} onChange={e => setCloseForm({ ...closeForm, endCash: e.target.value })} placeholder="أدخل مبلغ الدرج" dir="ltr" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">مبرر الفروقات / ملاحظات</label>
                            <textarea className="input" value={closeForm.notes} onInput={e => setCloseForm({ ...closeForm, notes: (e.target as HTMLTextAreaElement).value })} rows={3} dir="rtl" placeholder="في حال وجود عجز أو زيادة في الصندوق..." />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleCloseShift} style={{ background: 'var(--danger)', color: 'white', border: 'none' }}>إغلاق واعتِماد التسوية 🔒</button>
                            <button className="btn btn-ghost" onClick={() => setClosingShift(null)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
