'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function BankStatementPage() {
    const params = useParams();
    const router = useRouter();
    const [bank, setBank] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        type: 'deposit',
        amount: '',
        description: '',
        reference: '',
        linkedToTreasury: true
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [bankRes, txRes] = await Promise.all([
                fetch('/api/banks', { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/banks/${params.id}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (bankRes.ok && txRes.ok) {
                const banks = await bankRes.json();
                const currentBank = banks.find((b: any) => b.id === parseInt(params.id as string));
                if (currentBank) {
                    setBank(currentBank);
                } else {
                    router.push('/accounting/banks');
                }
                setTransactions(await txRes.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const handleSaveTransaction = async () => {
        if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
            alert('الرجاء إدخال مبلغ صحيح');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/banks/${params.id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: form.type,
                    amount: parseFloat(form.amount),
                    description: form.description,
                    reference: form.reference,
                    linkedToTreasury: form.linkedToTreasury
                })
            });

            if (res.ok) {
                setShowModal(false);
                setForm({ type: 'deposit', amount: '', description: '', reference: '', linkedToTreasury: true });
                fetchData(); // Refresh statement and balance
            } else {
                const data = await res.json();
                alert(data.error || 'حدث خطأ');
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    const fmtDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
    if (!bank) return <div style={{ padding: '40px', textAlign: 'center' }}>لم يتم العثور على الحساب البنكي</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <Link href="/accounting/banks" className="btn btn-ghost" style={{ padding: '8px', fontSize: '20px' }}>
                    ⬅️
                </Link>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>كشف حساب: {bank.bankName}</h1>
                    <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>
                        {bank.accountName} - {bank.accountNumber}
                    </p>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '20px' }}>
                <div className="card" style={{ background: 'var(--primary-color)', color: '#fff' }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 10px', opacity: 0.8 }}>الرصيد الحالي</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{fmt(bank.currentBalance)} {bank.currency}</div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-muted)' }}>رقم الآيبان IBAN</h3>
                        <div style={{ fontSize: '16px', fontWeight: '500', direction: 'ltr', textAlign: 'right' }}>{bank.iban || '—'}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-muted)' }}>إضافة حركة</h3>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ إيداع / سحب سريع</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '15px' }}>سجل الحركات (Transaction History)</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>نوع الحركة</th>
                                <th>الوصف</th>
                                <th>المرجع</th>
                                <th>المبلغ (إيداع)</th>
                                <th>المبلغ (سحب)</th>
                                <th>التسوية</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📝</div>
                                            <div className="empty-state-text">لا توجد حركات بنكية مسجلة</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : transactions.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontSize: '12px' }}>{fmtDate(t.transactionDate)}</td>
                                    <td>
                                        <span className={`badge ${t.type === 'deposit' ? 'badge-success' : 'badge-danger'}`}>
                                            {t.type === 'deposit' ? '📥 إيداع' : '📤 سحب / تحويل'}
                                        </span>
                                    </td>
                                    <td>{t.description || '—'}</td>
                                    <td dir="ltr">{t.reference || '—'}</td>
                                    <td style={{ fontWeight: '700', color: '#10b981' }}>
                                        {t.type === 'deposit' ? `+${fmt(t.amount)}` : '—'}
                                    </td>
                                    <td style={{ fontWeight: '700', color: '#ef4444' }}>
                                        {t.type !== 'deposit' ? `-${fmt(t.amount)}` : '—'}
                                    </td>
                                    <td>
                                        {t.isReconciled ? <span style={{ color: '#10b981' }}>✅ تمت</span> : <span style={{ color: '#f59e0b' }}>⏳ معلقة</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>تسجيل حركة بنكية يدوية</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">نوع الحركة</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className={`btn ${form.type === 'deposit' ? 'btn-success' : 'btn-ghost'}`} 
                                        style={{ flex: 1 }}
                                        onClick={() => setForm({ ...form, type: 'deposit' })}>
                                        📥 إيداع (Deposit)
                                    </button>
                                    <button 
                                        className={`btn ${form.type === 'withdrawal' ? 'btn-danger' : 'btn-ghost'}`} 
                                        style={{ flex: 1 }}
                                        onClick={() => setForm({ ...form, type: 'withdrawal' })}>
                                        📤 سحب (Withdrawal)
                                    </button>
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label className="input-label">المبلغ ({bank.currency}) *</label>
                                <input className="input" type="number" dir="ltr" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">البيان / الوصف</label>
                                <textarea className="input" placeholder="مثال: إيداع نقدي من مبيعات اليوم" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ height: '80px', resize: 'vertical' }} />
                            </div>

                            <div className="input-group">
                                <label className="input-label">رقم المرجع (رقم الإيصال/التحويل)</label>
                                <input className="input" dir="ltr" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                            </div>

                            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '20px', padding: '15px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                <input type="checkbox" id="linkedToTreasury" checked={form.linkedToTreasury} onChange={e => setForm({ ...form, linkedToTreasury: e.target.checked })} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
                                <div>
                                    <label htmlFor="linkedToTreasury" style={{ fontWeight: '600', cursor: 'pointer', display: 'block', marginBottom: '4px' }}>ربط الحركة بالخزينة (الصندوق)</label>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                                        {form.type === 'deposit' ? 'سيتم تسجيل "سحب" من الخزينة لحساب البنك لإثبات خروج النقدية.' : 'سيتم تسجيل "إيداع" في الخزينة من حساب البنك.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSaveTransaction} disabled={saving}>
                                {saving ? 'جاري الحفظ...' : '💾 تأكيد الحركة'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
