'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Customer { name: string; phone: string | null; }
interface LoyaltyTransaction { id: number; invoiceId: number | null; points: number; type: string; description: string | null; createdAt: string; }
interface LoyaltyPoint { id: number; customerId: number; points: number; totalEarned: number; totalRedeemed: number; tier: string; customer: Customer; }

export default function LoyaltyPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [loyalties, setLoyalties] = useState<LoyaltyPoint[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Transactions Modal
    const [showModal, setShowModal] = useState<LoyaltyPoint | null>(null);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    // Settings Modal
    const [showSettings, setShowSettings] = useState(false);
    const [earnRate, setEarnRate] = useState('10'); // Spend X SAR = 1 Point
    const [redeemRate, setRedeemRate] = useState('100'); // X Points = 1 SAR Discount
    const [savingSettings, setSavingSettings] = useState(false);


    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const res = await fetch('/api/loyalty', { headers: headers() });
            if (res.ok) setLoyalties(await res.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        finally { setLoading(false); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                const eRate = data.find((s: any) => s.key === 'loyalty_earn_rate');
                const rRate = data.find((s: any) => s.key === 'loyalty_redeem_rate');
                if (eRate && eRate.value) setEarnRate(eRate.value);
                if (rRate && rRate.value) setRedeemRate(rRate.value);
            }
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    };

    useEffect(() => { 
        fetchData(); 
        fetchSettings();
    }, []);

    const openTransactions = async (l: LoyaltyPoint) => {
        setShowModal(l);
        setLoadingTx(true);
        try {
            const res = await fetch(`/api/loyalty/${l.customerId}/transactions`, { headers: headers() });
            if (res.ok) setTransactions(await res.json());
            else setTransactions([]);
        } catch { setTransactions([]); }
        finally { setLoadingTx(false); }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const promises = [
                fetch('/api/settings', { method: 'POST', headers: headers(), body: JSON.stringify({ key: 'loyalty_earn_rate', value: earnRate }) }),
                fetch('/api/settings', { method: 'POST', headers: headers(), body: JSON.stringify({ key: 'loyalty_redeem_rate', value: redeemRate }) })
            ];
            await Promise.all(promises);
            alert(t('sys.str_697'));
            setShowSettings(false);
        } catch (e) { alert(t('sys.str_698')); }
        finally { setSavingSettings(false); }
    };

    const tierLabels: Record<string, { label: string; cls: string }> = {
        bronze: { label: t('sys.str_699'), cls: 'badge-ghost' },
        silver: { label: t('sys.str_700'), cls: 'badge-info' },
        gold: { label: t('sys.str_701'), cls: 'badge-warning' },
        platinum: { label: t('sys.str_702'), cls: 'badge-primary' }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('sys.str_671')}</h1>
                <button className="btn btn-primary" onClick={() => setShowSettings(true)}>{t('sys.str_672')}</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>{t('sys.str_673')}</th><th>{t('sys.str_477')}</th><th>{t('sys.str_674')}</th><th>{t('sys.str_675')}</th><th>{t('sys.str_676')}</th><th>{t('sys.str_677')}</th><th>{t('sys.str_678')}</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            : loyalties.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🎁</div><div className="empty-state-text">{t('sys.str_679')}</div></div></td></tr>
                            : loyalties.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: '600' }}>{l.customer?.name || t('sys.str_703')}</td>
                                    <td dir="ltr">{l.customer?.phone || '-'}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{l.points.toLocaleString()} {t('sys.str_680')}</td>
                                    <td style={{ color: '#10b981' }}>{l.totalEarned.toLocaleString()} {t('sys.str_680')}</td>
                                    <td style={{ color: '#ef4444' }}>{l.totalRedeemed.toLocaleString()} {t('sys.str_680')}</td>
                                    <td><span className={`badge ${tierLabels[l.tier]?.cls || 'badge-ghost'}`}>{tierLabels[l.tier]?.label || l.tier}</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openTransactions(l)}>{t('sys.str_681')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transactions Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_682')}{showModal.customer?.name}</h3>
                            <button className="modal-close" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '20px' }}>
                                <div><strong>{t('sys.str_683')}</strong> <span style={{ color: 'var(--primary-color)' }}>{showModal.points.toLocaleString()}</span> {t('sys.str_680')}</div>
                                <div><strong>{t('sys.str_684')}</strong> <span style={{ color: '#10b981' }}>{showModal.totalEarned.toLocaleString()}</span> {t('sys.str_680')}</div>
                            </div>
                            
                            {loadingTx ? <div style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_685')}</div>
                            : transactions.length === 0 ? <p style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_686')}</p>
                            : (
                                <table className="table" style={{ fontSize: '14px' }}>
                                    <thead><tr><th>{t('fin.str_232')}</th><th>{t('fin.str_199')}</th><th>{t('sys.str_687')}</th><th>{t('sys.str_510')}</th><th>{t('fin.str_222')}</th></tr></thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td><span className={`badge ${tx.type === 'earned' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{tx.type === 'earned' ? t('sys.str_704') : t('sys.str_705')}</span></td>
                                                <td style={{ fontWeight: 'bold', color: tx.type === 'earned' ? '#10b981' : '#ef4444' }}>{tx.type === 'earned' ? '+' : '-'}{tx.points}</td>
                                                <td>{tx.invoiceId ? `#${tx.invoiceId}` : '-'}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{tx.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(null)}>{t('sys.str_77')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_688')}</h3>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-control" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('sys.str_689')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{t('sys.str_690')}</span>
                                    <input type="number" className="input" style={{ width: '80px', textAlign: 'center' }} value={earnRate} onChange={e => setEarnRate(e.target.value)} min="1" />
                                    <span>{t('sys.str_691')}</span>
                                </div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{t('sys.str_692')}</small>
                            </div>
                            
                            <div className="form-control">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('sys.str_693')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{t('sys.str_694')}</span>
                                    <input type="number" className="input" style={{ width: '80px', textAlign: 'center' }} value={redeemRate} onChange={e => setRedeemRate(e.target.value)} min="1" />
                                    <span>{t('sys.str_695')}</span>
                                </div>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{t('sys.str_696')}</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowSettings(false)} disabled={savingSettings}>{t('fin.str_206')}</button>
                            <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
                                {savingSettings ? t('sys.str_454') : t('sys.str_706')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
