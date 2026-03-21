'use client';
import { useState, useEffect } from 'react';

interface PettyCash {
    id: number;
    amount: number;
    requestDate: string;
    purpose: string;
    status: 'PENDING' | 'DISBURSED' | 'SETTLED';
    settlementAmount: number;
    difference: number;
    employee: { id: number, name: string };
}

export default function PettyCashPage() {
    const [records, setRecords] = useState<PettyCash[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [settleModal, setSettleModal] = useState<PettyCash | null>(null);
    const [settleAmount, setSettleAmount] = useState('');
    
    const [form, setForm] = useState({ employeeId: '', amount: '', purpose: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [pcRes, empRes] = await Promise.all([
                fetch('/api/finance/petty-cash'),
                fetch('/api/hr/employees')
            ]);
            if (pcRes.ok) setRecords(await pcRes.json());
            if (empRes.ok) setEmployees(await empRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/petty-cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ employeeId: '', amount: '', purpose: '' });
                loadData();
            } else {
                alert('فشل حفظ طلب العهدة');
            }
        } catch (e) {}
    };

    const handleAction = async (id: number, action: string, amount: string = '0') => {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/finance/petty-cash/${id}/process`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: action, settlementAmount: amount })
        });
        if (res.ok) {
            setSettleModal(null);
            loadData();
        } else {
            alert('فشل تطبيق العملية');
        }
    };

    const statusMap: any = {
        PENDING: { label: 'بانتظار الصرف', color: '#f59e0b' },
        DISBURSED: { label: 'عهدة مستلمة', color: '#3b82f6' },
        SETTLED: { label: 'تمت التصفية', color: '#10b981' }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<>
        <div className="page-header"><h1 className="page-title">متابعة المصروفات النثرية والعهد (Petty Cash)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{records.length} عهدة مسجلة</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">➕ تسجيل تسليم عهدة</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم</th>
                            <th>الموظف المستلم</th>
                            <th>الغرض / البيان</th>
                            <th>تاريخ الطلب</th>
                            <th>مبلغ العهدة</th>
                            <th>الحالة</th>
                            <th>قيمة التصفية</th>
                            <th>إجراءات الإدارة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : records.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>لا توجد عهد</td></tr> : records.map(r => (
                            <tr key={r.id}>
                                <td><strong>PC-{r.id}</strong></td>
                                <td>{r.employee?.name}</td>
                                <td>{r.purpose}</td>
                                <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(r.amount)} ر.س</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                        backgroundColor: statusMap[r.status]?.color + '15', color: statusMap[r.status]?.color
                                    }}>
                                        {statusMap[r.status]?.label}
                                    </span>
                                </td>
                                <td>{r.status === 'SETTLED' ? <strong style={{color: '#10b981'}}>{fmt(r.settlementAmount)} ر.س</strong> : '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {r.status === 'PENDING' && (
                                            <button onClick={() => handleAction(r.id, 'DISBURSED')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>صرف العهدة (نقداً)</button>
                                        )}
                                        {r.status === 'DISBURSED' && (
                                            <button onClick={() => { setSettleModal(r); setSettleAmount(r.amount.toString()); }} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>تقديم فواتير التصفية</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Create Modal */}
        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal" style={{ maxWidth: '600px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>تسجيل عهدة جديدة</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">الموظف المقر له بالعهدة</label>
                            <select className="input" required value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                                <option value="">اختر الموظف...</option>
                                {employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">مبلغ العهدة</label>
                            <input required type="number" step="0.01" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">الغرض / التبرير</label>
                            <input required className="input" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" className="btn btn-primary">💾 حفظ العهدة</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Settle Modal */}
        {settleModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal" style={{ maxWidth: '500px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>تصفية وتسوية عهدة</h2>
                    <p style={{ color: 'var(--text-muted)' }}>الموظف: {settleModal.employee.name} | العهدة الأساسية: {settleModal.amount} ر.س</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">إجمالي قيمة فواتير المصروفات الفعلية</label>
                            <input type="number" step="0.01" className="input" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
                        </div>

                        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '13px' }}>
                            {parseFloat(settleAmount) < settleModal.amount && (
                                <span style={{ color: '#f59e0b' }}>⚠️ يجب على الموظف إرجاع <b>{settleModal.amount - parseFloat(settleAmount)} ر.س</b> إلى الصندوق، وسيتم إصدار سند قبض تلقائي.</span>
                            )}
                            {parseFloat(settleAmount) > settleModal.amount && (
                                <span style={{ color: '#3b82f6' }}>ℹ️ لقد تجاوز الموظف مبلغ العهدة بـ <b>{parseFloat(settleAmount) - settleModal.amount} ر.س</b> سيتم إصدار سند صرف تعويضي.</span>
                            )}
                            {parseFloat(settleAmount) === settleModal.amount && (
                                <span style={{ color: '#10b981' }}>✅ المطابقة تامة ولا يوجد فروقات نقدية متبقية.</span>
                            )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setSettleModal(null)}>إلغاء</button>
                            <button onClick={() => handleAction(settleModal.id, 'SETTLED', settleAmount)} className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>تأكيد واحتساب الدفاتر</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>);
}
