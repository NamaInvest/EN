'use client';
import { useState, useEffect } from 'react';

interface Check {
    id: number;
    type: 'PAYABLE' | 'RECEIVABLE';
    checkNumber: string;
    bankName: string;
    dueDate: string;
    amount: number;
    status: 'PENDING' | 'UNDER_COLLECTION' | 'CLEARED' | 'BOUNCED';
    notes?: string;
    customer?: { id: number, name: string };
    supplier?: { id: number, name: string };
}

export default function ChecksPage() {
    const [checks, setChecks] = useState<Check[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
    const [showModal, setShowModal] = useState(false);
    
    const [newCheck, setNewCheck] = useState({
        type: 'RECEIVABLE',
        checkNumber: '',
        bankName: '',
        dueDate: '',
        amount: '',
        notes: '',
        customerId: '',
        supplierId: ''
    });

    const [parties, setParties] = useState<any[]>([]);

    useEffect(() => { loadChecks(); }, [tab]);

    useEffect(() => {
        // Fetch parties based on type
        fetch(tab === 'RECEIVABLE' ? '/api/parties/customers' : '/api/parties/suppliers')
            .then(res => res.json())
            .then(data => setParties(Array.isArray(data) ? data : []));
    }, [tab]);

    async function loadChecks() {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/checks?type=${tab}`);
            if (res.ok) setChecks(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...newCheck,
                    type: tab,
                    customerId: tab === 'RECEIVABLE' ? parseInt(newCheck.customerId) : null,
                    supplierId: tab === 'PAYABLE' ? parseInt(newCheck.supplierId) : null,
                })
            });
            if (res.ok) {
                setShowModal(false);
                setNewCheck({ ...newCheck, checkNumber: '', amount: '', notes: '' });
                loadChecks();
            } else {
                alert('فشل حفظ الشيك');
            }
        } catch (e) {}
    };

    const handleAction = async (id: number, action: string) => {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/finance/checks/${id}/process`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: action })
        });
        if (res.ok) {
            loadChecks();
        } else {
            alert('فشل تطبيق العملية');
        }
    };

    const statusMap: any = {
        PENDING: { label: 'في الصندوق', color: '#f59e0b' },
        UNDER_COLLECTION: { label: 'تحت التحصيل', color: '#3b82f6' },
        CLEARED: { label: 'مُحصّل/مسحوب', color: '#10b981' },
        BOUNCED: { label: 'مرتجع', color: '#ef4444' },
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<>
        <div className="page-header"><h1 className="page-title">🏦 أوراق القبض والدفع (الشيكات)</h1></div>
        
        <div className="tabs" style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '15px' }}>
            <button onClick={() => setTab('RECEIVABLE')} className={`btn ${tab === 'RECEIVABLE' ? 'btn-primary' : 'btn-outline'}`}>أوراق القبض (الشيكات الواردة)</button>
            <button onClick={() => setTab('PAYABLE')} className={`btn ${tab === 'PAYABLE' ? 'btn-primary' : 'btn-outline'}`}>أوراق الدفع (الشيكات الصادرة)</button>
        </div>

        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{checks.length} شيك مسجل</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">➕ تسجيل شيك جديد</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الشيك</th>
                            <th>البنك</th>
                            <th>{tab === 'RECEIVABLE' ? 'العميل' : 'المورد'}</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>المبلغ</th>
                            <th>الحالة</th>
                            <th>إجراءات التحصيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : checks.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد شيكات</td></tr> : checks.map(c => (
                            <tr key={c.id}>
                                <td><strong>{c.checkNumber}</strong></td>
                                <td>{c.bankName}</td>
                                <td>{tab === 'RECEIVABLE' ? c.customer?.name : c.supplier?.name}</td>
                                <td>{new Date(c.dueDate).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(c.amount)} ر.س</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                        backgroundColor: statusMap[c.status]?.color + '15', color: statusMap[c.status]?.color
                                    }}>
                                        {statusMap[c.status]?.label}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {tab === 'RECEIVABLE' && c.status === 'PENDING' && (
                                            <button onClick={() => handleAction(c.id, 'UNDER_COLLECTION')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>إيداع (تحت التحصيل)</button>
                                        )}
                                        {tab === 'RECEIVABLE' && c.status === 'UNDER_COLLECTION' && (
                                            <button onClick={() => handleAction(c.id, 'CLEARED')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>تأكيد التحصيل</button>
                                        )}
                                        {tab === 'PAYABLE' && c.status === 'PENDING' && (
                                            <button onClick={() => handleAction(c.id, 'CLEARED')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>تأكيد الصرف المسحوب</button>
                                        )}
                                        {(c.status === 'PENDING' || c.status === 'UNDER_COLLECTION') && (
                                            <button onClick={() => handleAction(c.id, 'BOUNCED')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', color: 'red' }}>تسجيل مرتجع</button>
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
                    <h2>تسجيل شيك {tab === 'RECEIVABLE' ? 'وارد' : 'صادر'}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">رقم الشيك</label>
                            <input required className="input" value={newCheck.checkNumber} onChange={e => setNewCheck({...newCheck, checkNumber: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">البنك المسحوب عليه</label>
                            <input required className="input" value={newCheck.bankName} onChange={e => setNewCheck({...newCheck, bankName: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">تاريخ الاستحقاق</label>
                            <input required type="date" className="input" value={newCheck.dueDate} onChange={e => setNewCheck({...newCheck, dueDate: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">المبلغ</label>
                            <input required type="number" step="0.01" className="input" value={newCheck.amount} onChange={e => setNewCheck({...newCheck, amount: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">الجهة ({tab === 'RECEIVABLE' ? 'العميل' : 'المورد'})</label>
                            <select className="input" required value={tab === 'RECEIVABLE' ? newCheck.customerId : newCheck.supplierId} onChange={e => {
                                if (tab === 'RECEIVABLE') setNewCheck({...newCheck, customerId: e.target.value});
                                else setNewCheck({...newCheck, supplierId: e.target.value});
                            }}>
                                <option value="">اختر التوجيه...</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">ملاحظات</label>
                            <input className="input" value={newCheck.notes} onChange={e => setNewCheck({...newCheck, notes: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" className="btn btn-primary">💾 حفظ الشيك</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
