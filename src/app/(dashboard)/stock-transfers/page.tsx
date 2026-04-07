'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Transfer { id: number; transferNo: number; date: string; fromStockId: number; toStockId: number; notes: string; details: { productName: string; quantity: number }[] }
interface Stock { id: number; name: string }

export default function StockTransfersPage() {
    const { t } = useTranslation();
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); loadStocks(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/stock-transfers'); if (r.ok) setTransfers(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    async function loadStocks() { try { const r = await fetch('/api/products'); if (r.ok) { /* stocks from settings or hardcoded */ setStocks([{ id: 1, name: t('sys.str_3503') }, { id: 2, name: t('sys.str_3504') }]); } } catch (e) { console.error(e); } };

    const getStockName = (id: number) => stocks.find(s => s.id === id)?.name || `مخزن #${id}`;

    return (<><div className="page-header"><h1 className="page-title">{t('stock.str_1453')}</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{transfers.length} {t('sys.str_862')}</span><div className="toolbar-spacer" /></div>
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                    transfers.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔀</div><div className="empty-state-text">{t('stock.str_1455')}</div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{transfers.map(t => (
                            <div key={t.id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>#{t.transferNo}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('ar-SA')}</span>
                                    <span style={{ fontSize: '12px' }}>{getStockName(t.fromStockId)} ← {getStockName(t.toStockId)}</span>
                                    <div className="toolbar-spacer" />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.details?.length || 0} {t('stock.str_1456')}</span>
                                </div>
                                {expanded === t.id && t.details && <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}><th style={{ padding: '6px', textAlign: 'right' }}>{t('sys.str_63')}</th><th style={{ padding: '6px', textAlign: 'center' }}>{t('sys.str_64')}</th></tr></thead>
                                    <tbody>{t.details.map((d, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '6px', fontSize: '12px' }}>{d.productName}</td><td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace' }}>{d.quantity}</td></tr>)}</tbody>
                                </table>}
                            </div>
                        ))}</div>}
            </div>
        </div></>);
}
