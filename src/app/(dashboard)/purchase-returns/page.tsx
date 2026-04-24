'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Return { id: number; returnNo: number; date: string; subtotal: number; taxValue: number; total: number; notes: string }

export default function PurchaseReturnsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [returns, setReturns] = useState<Return[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ subtotal: '', notes: '', originalInvoiceId: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/purchase-returns'); if (r.ok) setReturns(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } setLoading(false); };
    const handleSave = async () => { const r = await fetch('/api/purchase-returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); setForm({ subtotal: '', notes: '', originalInvoiceId: '' }); load(); } };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<><div className="page-header"><h1 className="page-title">{t('sys.str_965')}</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{returns.length} {t('sys.str_966')}</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t('sys.str_967')}</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_968')}</label><input value={form.originalInvoiceId} onChange={e => setForm({ ...form, originalInvoiceId: e.target.value })} style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_969')}</label><input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} style={{ width: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_465')}</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '200px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>{t('fin.str_205')}</button><button className="btn btn-sm" onClick={() => setShowAdd(false)}>{t('fin.str_206')}</button>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                    returns.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔄</div><div className="empty-state-text">{t('sys.str_970')}</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>#</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_463')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_946')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_66')}</th></tr></thead>
                            <tbody>{returns.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{r.returnNo}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.subtotal)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{fmt(r.taxValue)}</td>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(r.total)}</td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
