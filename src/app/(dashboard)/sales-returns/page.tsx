'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

// Interfaces for new Returns flow
interface InvoiceDetail {
    productId: number;
    productName: string;
    quantity: number; // originally sold
    price: number;
    discountRate: number;
    discountValue: number;
    taxRate: number;
    taxValue: number;
    total: number;
}

interface Invoice {
    id: number;
    invoiceNo: number;
    date: string;
    subtotal: number;
    total: number;
    details: InvoiceDetail[];
}

interface ReturnItem {
    productId: number;
    productName: string;
    soldQuantity: number;
    returnQuantity: number;
    price: number;
    discountRate: number;
}

interface Return {
    id: number;
    returnNo: number;
    originalInvoiceId: number | null;
    date: string;
    subtotal: number;
    taxValue: number;
    total: number;
    notes: string;
}

export default function SalesReturnsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [returns, setReturns] = useState<Return[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);

    // New return state
    const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searching, setSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch('/api/sales-returns');
            if (r.ok) setReturns(await r.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    }

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    const fetchInvoice = async () => {
        if (!searchInvoiceNo) return;
        setSearching(true);
        setErrorMsg('');
        setOriginalInvoice(null);
        setReturnItems([]);

        try {
            const r = await fetch(`/api/sales?invoiceNo=${searchInvoiceNo}`);
            if (r.ok) {
                const invoices = await r.json();
                if (invoices && invoices.length > 0) {
                    const inv = invoices[0];
                    setOriginalInvoice(inv);
                    
                    // Initialize return items with 0 quantity
                    const items: ReturnItem[] = inv.details.map((d: InvoiceDetail) => ({
                        productId: d.productId,
                        productName: d.productName,
                        soldQuantity: d.quantity,
                        returnQuantity: 0,
                        price: d.price,
                        discountRate: d.discountRate
                    }));
                    setReturnItems(items);
                } else {
                    setErrorMsg(t('sales.str_1144'));
                }
            } else {
                setErrorMsg(t('sales.str_1145'));
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('sales.str_1146'));
        }
        setSearching(false);
    };

    const handleQuantityChange = (productId: number, val: string) => {
        const num = parseFloat(val) || 0;
        setReturnItems(prev => prev.map(item => {
            if (item.productId === productId) {
                // strict validation on client side too
                const safeNum = Math.max(0, Math.min(num, item.soldQuantity));
                return { ...item, returnQuantity: safeNum };
            }
            return item;
        }));
    };

    // Calculate totals dynamically based on selected return quantities
    const calculateTotals = () => {
        let sub = 0;
        returnItems.forEach(item => {
            if (item.returnQuantity > 0) {
                const itemTot = item.returnQuantity * item.price;
                const dVal = itemTot * (item.discountRate / 100);
                sub += (itemTot - dVal);
            }
        });
        const tax = sub * 0.15;
        return { subtotal: sub, tax, total: sub + tax };
    };

    const currentTotals = calculateTotals();

    const handleSave = async () => {
        const itemsToReturn = returnItems
            .filter(item => item.returnQuantity > 0)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.returnQuantity,
                price: item.price,
                discountRate: item.discountRate
            }));

        if (itemsToReturn.length === 0) {
            setErrorMsg(t('sales.str_1147'));
            return;
        }

        const payload = {
            originalInvoiceId: originalInvoice?.id,
            notes,
            items: itemsToReturn
        };

        try {
            const r = await fetch('/api/sales-returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (r.ok) {
                setShowAdd(false);
                setSearchInvoiceNo('');
                setOriginalInvoice(null);
                setReturnItems([]);
                setNotes('');
                load();
            } else {
                const err = await r.json();
                setErrorMsg(err.error || t('sales.str_1148'));
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('sales.str_1149'));
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('sales.str_1127')}</h1>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{returns.length} {t('sys.str_966')}</span>
                    <div className="toolbar-spacer" />
                    {!showAdd && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t('sys.str_967')}</button>}
                </div>

                {showAdd && (
                    <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            {t('sales.str_1128')}</h3>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sales.str_1129')}</label>
                                <input 
                                    value={searchInvoiceNo} 
                                    onChange={e => setSearchInvoiceNo(e.target.value)} 
                                    placeholder={t('sales.str_1150')}
                                    onKeyDown={e => e.key === 'Enter' && fetchInvoice()}
                                    style={{ width: '200px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                />
                            </div>
                            <button className="btn btn-primary" onClick={fetchInvoice} disabled={searching || !searchInvoiceNo}>
                                {searching ? t('sales.str_1151') : t('sales.str_1152')}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setOriginalInvoice(null); setErrorMsg(''); }}>{t('fin.str_206')}</button>
                        </div>

                        {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{errorMsg}</div>}

                        {originalInvoice && (
                            <div style={{ background: 'var(--bg-card-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                                    <div><strong>{t('sales.str_1130')}</strong> #{originalInvoice.invoiceNo}</div>
                                    <div><strong>{t('sys.str_113')}</strong> {new Date(originalInvoice.date).toLocaleDateString('en-GB')}</div>
                                    <div><strong>{t('sales.str_1131')}</strong> {fmt(originalInvoice.total)} {t('sys.str_68')}</div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-card)' }}>
                                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>{t('sys.str_63')}</th>
                                            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>{t('sales.str_1132')}</th>
                                            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', width: '150px' }}>{t('sales.str_1133')}</th>
                                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>{t('sales.str_1134')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map(item => {
                                            const lineItemTotal = item.returnQuantity * item.price * (1 - item.discountRate/100) * 1.15;
                                            return (
                                            <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold' }}>{item.productName}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{item.soldQuantity}</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max={item.soldQuantity}
                                                        value={item.returnQuantity === 0 ? '' : item.returnQuantity} 
                                                        placeholder="0"
                                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                                        style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--primary)', textAlign: 'center', fontWeight: 'bold' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'left', fontFamily: 'monospace', color: 'var(--danger)' }}>
                                                    {lineItemTotal > 0 ? `-${fmt(lineItemTotal)}` : '0.00'}
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sales.str_1135')}</label>
                                        <input 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            placeholder={t('sales.str_1153')}
                                            style={{ width: '100%', maxWidth: '300px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sales.str_1136')}{fmt(currentTotals.subtotal)}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sales.str_1137')}{fmt(currentTotals.tax)}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)' }}>{t('sales.str_1138')}{fmt(currentTotals.total)} {t('sys.str_68')}</div>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '16px', textAlign: 'left' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleSave}
                                        disabled={currentTotals.total === 0}
                                        style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
                                    >
                                        {t('sales.str_1139')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                        returns.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔄</div><div className="empty-state-text">{t('sales.str_1140')}</div></div> :
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sales.str_1141')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sales.str_1142')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_463')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_946')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sales.str_1143')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_465')}</th>
                                    </tr>
                                </thead>
                                <tbody>{returns.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>#{r.returnNo}</td>
                                        <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--primary)' }}>
                                            {r.originalInvoiceId ? `#INV-${r.originalInvoiceId}` : t('sales.str_1154')}
                                        </td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.subtotal)}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{fmt(r.taxValue)}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--danger)' }}>-{fmt(r.total)}</td>
                                        <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.notes || '-'}</td>
                                    </tr>
                                ))}</tbody>
                            </table>}
                </div>
            </div>
        </>
    );
}
