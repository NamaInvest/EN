'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

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
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
                alert(t('sys.str_2741'));
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
            alert(t('sys.str_2742'));
        }
    };

    const statusMap: any = {
        PENDING: { label: t('sys.str_2743'), color: '#f59e0b' },
        UNDER_COLLECTION: { label: t('sys.str_2744'), color: '#3b82f6' },
        CLEARED: { label: t('sys.str_2745'), color: '#10b981' },
        BOUNCED: { label: t('sys.str_966'), color: '#ef4444' },
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<>
        <div className="page-header"><h1 className="page-title">{t('sys.str_2723')}</h1></div>
        
        <div className="tabs" style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '15px' }}>
            <button onClick={() => setTab('RECEIVABLE')} className={`btn ${tab === 'RECEIVABLE' ? 'btn-primary' : 'btn-outline'}`}>{t('sys.str_2724')}</button>
            <button onClick={() => setTab('PAYABLE')} className={`btn ${tab === 'PAYABLE' ? 'btn-primary' : 'btn-outline'}`}>{t('sys.str_2725')}</button>
        </div>

        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{checks.length} {t('sys.str_2726')}</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">{t('sys.str_2727')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('sys.str_2728')}</th>
                            <th>{t('sys.str_2729')}</th>
                            <th>{tab === 'RECEIVABLE' ? t('sys.str_460') : t('sys.str_953')}</th>
                            <th>{t('sys.str_666')}</th>
                            <th>{t('sys.str_463')}</th>
                            <th>{t('fin.str_227')}</th>
                            <th>{t('sys.str_2730')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : checks.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_2731')}</td></tr> : checks.map(c => (
                            <tr key={c.id}>
                                <td><strong>{c.checkNumber}</strong></td>
                                <td>{c.bankName}</td>
                                <td>{tab === 'RECEIVABLE' ? c.customer?.name : c.supplier?.name}</td>
                                <td>{new Date(c.dueDate).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(c.amount)} {t('sys.str_68')}</td>
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
                                            <button onClick={() => handleAction(c.id, 'UNDER_COLLECTION')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('sys.str_2732')}</button>
                                        )}
                                        {tab === 'RECEIVABLE' && c.status === 'UNDER_COLLECTION' && (
                                            <button onClick={() => handleAction(c.id, 'CLEARED')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>{t('sys.str_2733')}</button>
                                        )}
                                        {tab === 'PAYABLE' && c.status === 'PENDING' && (
                                            <button onClick={() => handleAction(c.id, 'CLEARED')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}>{t('sys.str_2734')}</button>
                                        )}
                                        {(c.status === 'PENDING' || c.status === 'UNDER_COLLECTION') && (
                                            <button onClick={() => handleAction(c.id, 'BOUNCED')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', color: 'red' }}>{t('sys.str_2735')}</button>
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
                    <h2>{t('sys.str_2736')}{tab === 'RECEIVABLE' ? t('sys.str_2746') : t('sys.str_2747')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2728')}</label>
                            <input required className="input" value={newCheck.checkNumber} onChange={e => setNewCheck({...newCheck, checkNumber: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2737')}</label>
                            <input required className="input" value={newCheck.bankName} onChange={e => setNewCheck({...newCheck, bankName: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_666')}</label>
                            <input required type="date" className="input" value={newCheck.dueDate} onChange={e => setNewCheck({...newCheck, dueDate: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_463')}</label>
                            <input required type="number" step="0.01" className="input" value={newCheck.amount} onChange={e => setNewCheck({...newCheck, amount: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_2738')}{tab === 'RECEIVABLE' ? t('sys.str_460') : t('sys.str_953')})</label>
                            <select className="input" required value={tab === 'RECEIVABLE' ? newCheck.customerId : newCheck.supplierId} onChange={e => {
                                if (tab === 'RECEIVABLE') setNewCheck({...newCheck, customerId: e.target.value});
                                else setNewCheck({...newCheck, supplierId: e.target.value});
                            }}>
                                <option value="">{t('sys.str_2739')}</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('sys.str_465')}</label>
                            <input className="input" value={newCheck.notes} onChange={e => setNewCheck({...newCheck, notes: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                            <button type="submit" className="btn btn-primary">{t('sys.str_2740')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
