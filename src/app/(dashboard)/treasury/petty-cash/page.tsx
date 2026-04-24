'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

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
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
                alert(t('sys.str_2774'));
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
            alert(t('sys.str_2742'));
        }
    };

    const statusMap: any = {
        PENDING: { label: t('sys.str_2775'), color: '#f59e0b' },
        DISBURSED: { label: t('sys.str_2776'), color: '#3b82f6' },
        SETTLED: { label: t('sys.str_2777'), color: '#10b981' }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<>
        <div className="page-header"><h1 className="page-title">{t('sys.str_2748')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{records.length} {t('sys.str_2749')}</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">{t('sys.str_2750')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('sys.str_2751')}</th>
                            <th>{t('sys.str_2752')}</th>
                            <th>{t('sys.str_2753')}</th>
                            <th>{t('sys.str_2754')}</th>
                            <th>{t('sys.str_2755')}</th>
                            <th>{t('fin.str_227')}</th>
                            <th>{t('sys.str_2756')}</th>
                            <th>{t('sys.str_2757')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : records.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_2758')}</td></tr> : records.map(r => (
                            <tr key={r.id}>
                                <td><strong>PC-{r.id}</strong></td>
                                <td>{r.employee?.name}</td>
                                <td>{r.purpose}</td>
                                <td>{new Date(r.requestDate).toLocaleDateString('en-GB')}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(r.amount)} {t('sys.str_68')}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                        backgroundColor: statusMap[r.status]?.color + '15', color: statusMap[r.status]?.color
                                    }}>
                                        {statusMap[r.status]?.label}
                                    </span>
                                </td>
                                <td>{r.status === 'SETTLED' ? <strong style={{color: '#10b981'}}>{fmt(r.settlementAmount)} {t('sys.str_68')}</strong> : '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {r.status === 'PENDING' && (
                                            <button onClick={() => handleAction(r.id, 'DISBURSED')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('sys.str_2759')}</button>
                                        )}
                                        {r.status === 'DISBURSED' && (
                                            <button onClick={() => { setSettleModal(r); setSettleAmount(r.amount.toString()); }} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>{t('sys.str_2760')}</button>
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
                    <h2>{t('sys.str_2761')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2762')}</label>
                            <select className="input" required value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                                <option value="">{t('hr.str_2138')}</option>
                                {employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2755')}</label>
                            <input required type="number" step="0.01" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2763')}</label>
                            <input required className="input" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                            <button type="submit" className="btn btn-primary">{t('sys.str_2764')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Settle Modal */}
        {settleModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal" style={{ maxWidth: '500px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>{t('sys.str_2765')}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{t('sys.str_1430')}{settleModal.employee.name} {t('sys.str_2766')}{settleModal.amount} {t('sys.str_68')}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2767')}</label>
                            <input type="number" step="0.01" className="input" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
                        </div>

                        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '13px' }}>
                            {parseFloat(settleAmount) < settleModal.amount && (
                                <span style={{ color: '#f59e0b' }}>{t('sys.str_2768')}<b>{settleModal.amount - parseFloat(settleAmount)} {t('sys.str_68')}</b> {t('sys.str_2769')}</span>
                            )}
                            {parseFloat(settleAmount) > settleModal.amount && (
                                <span style={{ color: '#3b82f6' }}>{t('sys.str_2770')}<b>{parseFloat(settleAmount) - settleModal.amount} {t('sys.str_68')}</b> {t('sys.str_2771')}</span>
                            )}
                            {parseFloat(settleAmount) === settleModal.amount && (
                                <span style={{ color: '#10b981' }}>{t('sys.str_2772')}</span>
                            )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setSettleModal(null)}>{t('fin.str_206')}</button>
                            <button onClick={() => handleAction(settleModal.id, 'SETTLED', settleAmount)} className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>{t('sys.str_2773')}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>);
}
