'use client';

import { useState, useEffect } from 'react';

interface Customer { name: string; phone: string | null; }
interface LoyaltyTransaction { id: number; invoiceId: number | null; points: number; type: string; description: string | null; createdAt: string; }
interface LoyaltyPoint { id: number; customerId: number; points: number; totalEarned: number; totalRedeemed: number; tier: string; customer: Customer; }

export default function LoyaltyPage() {
    const [loyalties, setLoyalties] = useState<LoyaltyPoint[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Transactions Modal
    const [showModal, setShowModal] = useState<LoyaltyPoint | null>(null);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const res = await fetch('/api/loyalty', { headers: headers() });
            if (res.ok) setLoyalties(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

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

    const tierLabels: Record<string, { label: string; cls: string }> = {
        bronze: { label: '🥉 برونزي', cls: 'badge-ghost' },
        silver: { label: '🥈 فضي', cls: 'badge-info' },
        gold: { label: '🥇 ذهبي', cls: 'badge-warning' },
        platinum: { label: '💎 بلاتيني', cls: 'badge-primary' }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🎁 برنامج الولاء</h1>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>اسم العميل</th><th>الجوال</th><th>الرصيد الحالي</th><th>إجمالي المكتسب</th><th>إجمالي المستبدل</th><th>الفئة (Tier)</th><th>سجل الحركات</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            : loyalties.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🎁</div><div className="empty-state-text">لا يوجد عملاء مسجلين في برنامج الولاء</div></div></td></tr>
                            : loyalties.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: '600' }}>{l.customer?.name || 'عميل محذوف'}</td>
                                    <td dir="ltr">{l.customer?.phone || '-'}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{l.points.toLocaleString()} نقطة</td>
                                    <td style={{ color: '#10b981' }}>{l.totalEarned.toLocaleString()} نقطة</td>
                                    <td style={{ color: '#ef4444' }}>{l.totalRedeemed.toLocaleString()} نقطة</td>
                                    <td><span className={`badge ${tierLabels[l.tier]?.cls || 'badge-ghost'}`}>{tierLabels[l.tier]?.label || l.tier}</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openTransactions(l)}>📜 كشف الحركات</button>
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
                            <h3>📜 سجل النقاط: {showModal.customer?.name}</h3>
                            <button className="modal-close" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '20px' }}>
                                <div><strong>الرصيد الحالي:</strong> <span style={{ color: 'var(--primary-color)' }}>{showModal.points.toLocaleString()}</span> نقطة</div>
                                <div><strong>إجمالي المكتسب:</strong> <span style={{ color: '#10b981' }}>{showModal.totalEarned.toLocaleString()}</span> نقطة</div>
                            </div>
                            
                            {loadingTx ? <div style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل السجل...</div>
                            : transactions.length === 0 ? <p style={{ textAlign: 'center', padding: '20px' }}>لا يوجد حركات مسجلة</p>
                            : (
                                <table className="table" style={{ fontSize: '14px' }}>
                                    <thead><tr><th>التاريخ</th><th>النوع</th><th>النقاط</th><th>رقم الفاتورة</th><th>البيان</th></tr></thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</td>
                                                <td><span className={`badge ${tx.type === 'earned' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{tx.type === 'earned' ? 'مكتسبة' : 'مستبدلة'}</span></td>
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
                            <button className="btn btn-ghost" onClick={() => setShowModal(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
