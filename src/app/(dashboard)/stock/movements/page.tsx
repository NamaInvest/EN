'use client';
import { useState, useEffect } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Repeat, Edit3 } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function StockMovementsPage() {
    const { t } = useTranslation();
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/stock/movements', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setMovements(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const getTypeDetails = (type: string) => {
        switch(type) {
            case 'in': return { icon: <ArrowDownRight size={16}/>, color: '#10b981', label: t('stock.str_2648') };
            case 'out': return { icon: <ArrowUpRight size={16}/>, color: '#ef4444', label: t('stock.str_2649') };
            case 'transfer': return { icon: <Repeat size={16}/>, color: '#3b82f6', label: t('stock.str_2650') };
            case 'adjustment': return { icon: <Edit3 size={16}/>, color: '#f59e0b', label: t('stock.str_2651') };
            default: return { icon: <Activity size={16}/>, color: '#6b7280', label: type };
        }
    };

    return (<>
        <div className="page-header"><h1 className="page-title">{t('stock.str_2642')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('stock.str_2643')}</span>
                <div className="toolbar-spacer" />
                <button onClick={loadData} className="btn btn-outline" style={{ fontSize: '12px' }}>
                    {t('stock.str_2644')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('stock.str_2617')}</th>
                            <th>{t('sales.str_2418')}</th>
                            <th>{t('sys.str_2227')}</th>
                            <th>{t('sys.str_2231')}</th>
                            <th>{t('stock.str_2645')}</th>
                            <th>{t('sys.str_64')}</th>
                            <th>{t('stock.str_2646')}</th>
                            <th>{t('sys.str_386')}</th>
                            <th>{t('sys.str_465')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : movements.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>{t('stock.str_2647')}</td></tr> : movements.map(m => {
                            const details = getTypeDetails(m.type);
                            return (
                                <tr key={m.id}>
                                    <td><strong style={{color: '#6366f1'}}>M-{m.id}</strong></td>
                                    <td><span dir="ltr">{new Date(m.date).toLocaleString()}</span></td>
                                    <td>{m.stock?.name}</td>
                                    <td>{m.product?.name} <span style={{fontSize:'11px', color:'#888'}}>({m.product?.sku})</span></td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: details.color, fontSize: '13px', fontWeight: 600 }}>
                                            {details.icon} {details.label}
                                        </span>
                                    </td>
                                    <td><strong style={{color: details.color}}>{m.type === 'out' ? '-' : '+'}{m.quantity}</strong></td>
                                    <td><span style={{backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '11px'}}>{m.referenceType || 'N/A'} {m.referenceId ? `#${m.referenceId}` : ''}</span></td>
                                    <td>{m.user?.fullName || t('stock.str_1485')}</td>
                                    <td style={{fontSize:'12px', maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={m.notes}>{m.notes || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </>);
}