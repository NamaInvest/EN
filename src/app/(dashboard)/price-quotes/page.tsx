'use client';
import { useState, useEffect, useRef } from 'react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";

interface Product { id: number; name: string; sellPrice: number; barcode: string | null }
interface QuoteItem { productId: number | null; productName: string; quantity: number; price: number }
interface Quote { id: number; quoteNo: number; date: string; total: number; status: string; notes: string; details: { productName: string; quantity: number; price: number; total: number }[] }

export default function PriceQuotesPage() {
    const { t } = useTranslation();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastQuoteData, setLastQuoteData] = useState<any>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [notes, setNotes] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [searchText, setSearchText] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeRow, setActiveRow] = useState(-1);
    const searchRef = useRef<HTMLInputElement>(null);
    const [settings, setSettings] = useState<Record<string,string>>({});

    useEffect(() => { load(); loadProducts(); loadSettings(); }, []);

    async function load() {
        setLoading(true);
        try { const r = await fetch('/api/price-quotes'); if (r.ok) setQuotes(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    async function loadProducts() {
        try { const r = await fetch('/api/products'); if (r.ok) setProducts(await r.json()); } catch { }
    };

    async function loadSettings() {
        try {
            const r = await fetch('/api/settings');
            if (r.ok) {
                const data = await r.json();
                const map: Record<string,string> = {};
                if (Array.isArray(data)) data.forEach((s: {key:string;value:string}) => { map[s.key] = s.value; });
                else Object.assign(map, data);
                setSettings(map);
            }
        } catch { }
    };

    const filteredProducts = products.filter(p =>
        p.name.includes(searchText) || (p.barcode && p.barcode.includes(searchText))
    ).slice(0, 10);

    const addProduct = (product: Product) => {
        const existing = items.findIndex(it => it.productId === product.id);
        if (existing >= 0) {
            const updated = [...items];
            updated[existing].quantity += 1;
            setItems(updated);
        } else {
            setItems([...items, { productId: product.id, productName: product.name, quantity: 1, price: product.sellPrice }]);
        }
        setSearchText('');
        setShowSearch(false);
    };

    const addManualItem = () => {
        setItems([...items, { productId: null, productName: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        setItems(updated);
    };

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const handleSave = async () => {
        if (items.length === 0) return;
        const res = await fetch('/api/price-quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, notes }),
        });
        if (res.ok) {
            const saved = await res.json();
            setShowAdd(false);
            setItems([]);
            setNotes('');
            load();
            // Auto-print
            handlePrint({ ...saved, date: saved.date || new Date().toISOString(), details: saved.details || items.map((it: QuoteItem) => ({ productName: it.productName, quantity: it.quantity, price: it.price, total: it.quantity * it.price })) });
        }
    };

    const handlePrint = (quote: Quote) => {
        const taxAmt = quote.total * 0.15;
        const grandTotal = quote.total + taxAmt;
        setLastQuoteData({
            invoiceNumber: quote.quoteNo.toString(),
            date: quote.date,
            customerName: 'عميل نقدي',
            paymentMethod: 'نقدي',
            items: quote.details.map((d: any) => ({
                name: d.productName,
                quantity: d.quantity,
                price: d.price,
                total: d.total
            })),
            subtotal: quote.total,
            discount: 0,
            taxRate: 15,
            taxAmount: taxAmt,
            grandTotal: grandTotal
        });
        setShowReceipt(true);
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    return (<>
        <div className="page-header"><h1 className="page-title">{t('sys.str_1265')}</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{quotes.length} {t('sys.str_927')}</span>
                <div className="toolbar-spacer" />
                <button className="btn btn-primary" onClick={() => { setShowAdd(true); setItems([]); }}>{t('sys.str_4253')}</button>
            </div>

            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>{t('sys.str_4254')}</h3>

                {/* Product Search */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <input
                        ref={searchRef}
                        value={searchText}
                        onChange={e => { setSearchText(e.target.value); setShowSearch(true); }}
                        onFocus={() => setShowSearch(true)}
                        placeholder={t('sys.str_4257')}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                            border: '2px solid var(--primary)', fontSize: '14px',
                            background: 'var(--card-bg)'
                        }}
                    />
                    {showSearch && searchText && filteredProducts.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: 'var(--card-bg)', border: '1px solid var(--border)',
                            borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            maxHeight: '250px', overflowY: 'auto'
                        }}>
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => addProduct(p)}
                                    style={{
                                        padding: '10px 14px', cursor: 'pointer',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.1)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span>{p.name}</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{fmt(p.sellPrice)} {t('sys.str_68')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Items Table */}
                {items.length > 0 && <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                    <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_4255')}</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '80px' }}>{t('sys.str_64')}</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>{t('sys.str_65')}</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>{t('sys.str_947')}</th>
                        <th style={{ width: '40px' }}></th>
                    </tr></thead>
                    <tbody>{items.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: '4px' }}>
                                <input value={item.productName}
                                    onChange={e => updateItem(i, 'productName', e.target.value)}
                                    placeholder={t('sys.str_4258')}
                                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                                />
                            </td>
                            <td style={{ padding: '4px' }}>
                                <input type="number" value={item.quantity}
                                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                                    style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', background: 'var(--card-bg)' }}
                                />
                            </td>
                            <td style={{ padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {fmt(item.price)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {fmt(item.quantity * item.price)}
                            </td>
                            <td style={{ padding: '4px' }}>
                                <button onClick={() => removeItem(i)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>}

                {/* Total */}
                {items.length > 0 && <div style={{
                    textAlign: 'left', padding: '8px 12px', background: 'rgba(108,99,255,0.05)',
                    borderRadius: '8px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold'
                }}>
                    {t('sys.str_71')}{fmt(total)} {t('sys.str_68')}</div>}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={addManualItem}>{t('sys.str_4256')}</button>
                    <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('sys.str_465')}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '150px', background: 'var(--card-bg)' }} />
                    <button className="btn btn-sm" onClick={() => setShowAdd(false)}>{t('fin.str_206')}</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={items.length === 0}>{t('sys.str_455')}</button>
                </div>
            </div>}

            {/* Quotes List */}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                    quotes.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-text">{t('sys.str_793')}</div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{quotes.map(q => (
                            <div key={q.id} className="card" style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>#{q.quoteNo}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(q.date).toLocaleDateString('ar-SA')}</span>
                                    <div className="toolbar-spacer" />
                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(q.total)} {t('sys.str_68')}</span>
                                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); handlePrint(q); }}
                                        style={{ fontSize: '12px', padding: '4px 10px' }}>🖨️</button>
                                </div>
                                {expanded === q.id && q.details && <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(108,99,255,0.03)' }}>
                                        <th style={{ padding: '6px', textAlign: 'right', fontSize: '12px' }}>{t('sys.str_63')}</th>
                                        <th style={{ padding: '6px', textAlign: 'center', fontSize: '12px' }}>{t('sys.str_64')}</th>
                                        <th style={{ padding: '6px', textAlign: 'center', fontSize: '12px' }}>{t('sys.str_65')}</th>
                                        <th style={{ padding: '6px', textAlign: 'left', fontSize: '12px' }}>{t('sys.str_947')}</th>
                                    </tr></thead>
                                    <tbody>{q.details.map((d, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '6px', fontSize: '12px' }}>{d.productName}</td>
                                        <td style={{ padding: '6px', textAlign: 'center', fontSize: '12px' }}>{d.quantity}</td>
                                        <td style={{ padding: '6px', fontFamily: 'monospace', textAlign: 'center' }}>{fmt(d.price)}</td>
                                        <td style={{ padding: '6px', fontFamily: 'monospace', textAlign: 'left' }}>{fmt(d.total)}</td>
                                    </tr>)}</tbody>
                                </table>}
                            </div>
                        ))}</div>}
            </div>
        </div>

        {showReceipt && lastQuoteData && (
            <InvoiceReceipt
                invoiceData={lastQuoteData}
                autoPrint={true}
                isQuote={true}
                onClose={() => setShowReceipt(false)}
            />
        )}
    </>);
}
