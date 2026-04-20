'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Product { id: number; name: string; sellPrice: number; barcode: string | null }
interface QuoteItem { productId: number | null; productName: string; quantity: number; price: number }
interface QuoteDetail { productName: string; quantity: number; price: number; total: number }
interface Quote { id: number; quoteNo: number; date: string; total: number; status: string; notes: string; details: QuoteDetail[] }

export default function PriceQuotesPage() {
    const { t } = useTranslation();
    const [quotes, setQuotes]           = useState<Quote[]>([]);
    const [expanded, setExpanded]       = useState<number | null>(null);
    const [loading, setLoading]         = useState(true);
    const [showAdd, setShowAdd]         = useState(false);
    const [items, setItems]             = useState<QuoteItem[]>([]);
    const [notes, setNotes]             = useState('');
    const [products, setProducts]       = useState<Product[]>([]);
    const [searchText, setSearchText]   = useState('');
    const [showSearch, setShowSearch]   = useState(false);
    const [settings, setSettings]       = useState<Record<string, string>>({});
    const searchRef = useRef<HTMLInputElement>(null);

    // تحويل ظ„فاتورة
    const [convertingId, setConvertingId] = useState<number | null>(null);
    const [paymentType, setPaymentType]   = useState('cash');
    const [converting, setConverting]     = useState(false);

    useEffect(() => { load(); loadProducts(); loadSettings(); }, []);

    async function load() {
        setLoading(true);
        try { const r = await fetch('/api/price-quotes'); if (r.ok) setQuotes(await r.json()); } catch { }
        setLoading(false);
    }

    async function loadProducts() {
        try { const r = await fetch('/api/products'); if (r.ok) setProducts(await r.json()); } catch { }
    }

    async function loadSettings() {
        try {
            const r = await fetch('/api/settings');
            if (r.ok) {
                const data = await r.json();
                const map: Record<string, string> = {};
                if (Array.isArray(data)) data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
                else Object.assign(map, data);
                setSettings(map);
            }
        } catch { }
    }

    const isTaxInclusive = settings['POS_TAX_INCLUSIVE'] !== 'false';
    const taxRate = parseFloat(settings['tax_rate'] || '15') || 15;

    const subtotal = items.reduce((sum, item) => {
        let p = item.price;
        if (isTaxInclusive) p = p * 100 / (100 + taxRate);
        return sum + item.quantity * p;
    }, 0);
    const taxValue   = subtotal * (taxRate / 100);
    const total      = isTaxInclusive
        ? items.reduce((s, i) => s + i.quantity * i.price, 0)
        : subtotal + taxValue;

    const filteredProducts = products.filter(p =>
        p.name.includes(searchText) || (p.barcode && p.barcode.includes(searchText))
    ).slice(0, 10);

    const addProduct = (product: Product) => {
        const ex = items.findIndex(it => it.productId === product.id);
        if (ex >= 0) {
            const u = [...items]; u[ex].quantity += 1; setItems(u);
        } else {
            setItems([...items, { productId: product.id, productName: product.name, quantity: 1, price: product.sellPrice }]);
        }
        setSearchText(''); setShowSearch(false);
    };

    const addManualItem = () => setItems([...items, { productId: null, productName: '', quantity: 1, price: 0 }]);
    const removeItem    = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem    = (i: number, field: keyof QuoteItem, value: string | number) => {
        const u = [...items]; (u[i] as any)[field] = value; setItems(u);
    };

    const handleSave = async () => {
        if (items.length === 0) return;
        const res = await fetch('/api/price-quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, notes, isTaxInclusive, taxRate }),
        });
        if (res.ok) {
            const saved = await res.json();
            setShowAdd(false); setItems([]); setNotes('');
            load();
            // طباعة طھظ„ظ‚ط§ط¦ظٹط© ط¨ط¹ط¯ ط§ظ„حفظ
            setTimeout(() => printQuoteA4(saved), 300);
        }
    };

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    //  طباعة A4 ط§ط­طھط±ط§ظپظٹط© ط¨ط¯ظˆظ† ط¨ط§ط±ظƒظˆط¯
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    const printQuoteA4 = (quote: Quote) => {
        const companyName    = settings['company_name']    || settings['company_name_ar'] || 'ط§ظ„ظ…ظ†ط´ط£ط©';
        const vatNumber      = settings['tax_number']      || '';
        const crNumber       = settings['zatca_crn']       || settings['cr_number'] || '';
        const companyAddress = settings['company_address'] || settings['company_address_ar'] || '';
        const companyCity    = settings['zatca_city']      || settings['company_city'] || '';
        const rate           = parseFloat(settings['tax_rate'] || '15') || 15;

        // ط­ط³ط§ط¨ الإجماليط§طھ
        const sub   = quote.details.reduce((s, d) => s + d.total, 0);
        const tax   = sub * (rate / 100);
        const grand = sub + tax;

        const rows = quote.details.map(d => `
            <tr>
                <td style="text-align:right; padding:8px; border:1px solid #ccc;">${d.productName}</td>
                <td style="text-align:center; padding:8px; border:1px solid #ccc;">${d.quantity}</td>
                <td style="text-align:center; padding:8px; border:1px solid #ccc;">${fmt(d.price)}</td>
                <td style="text-align:center; padding:8px; border:1px solid #ccc;">${fmt(d.total)}</td>
            </tr>`).join('');

        const notesLine = quote.notes ? `<div style="margin-top:16px;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:#555;"><strong>ظ…لاط­ط¸ط§طھ:</strong> ${quote.notes}</div>` : '';

        const win = window.open('', '_blank', 'width=850,height=1100');
        if (!win) return;
        win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>عرض سعر #${quote.quoteNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lateef:wght@400;600;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Lateef',sans-serif; padding:30px 40px; color:#000; background:#fff; direction:rtl; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e293b; padding-bottom:16px; margin-bottom:20px; }
    .company-info h1 { font-size:26px; font-weight:800; color:#1e293b; margin-bottom:4px; }
    .company-info p  { font-size:12px; color:#555; margin-bottom:2px; }
    .quote-info { text-align:left; background:#f8fafc; padding:16px 20px; border-radius:8px; border:1px solid #e2e8f0; min-width:220px; }
    .quote-info .title { font-size:18px; font-weight:800; color:#1e293b; text-align:center; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; }
    .quote-info .row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
    .quote-info .row span:first-child { color:#555; }
    .quote-info .row span:last-child  { font-weight:700; }
    table { width:100%; border-collapse:collapse; margin:20px 0; font-size:13px; }
    thead tr { background:#1e293b; color:#fff; }
    thead th { padding:10px 8px; text-align:center; font-weight:600; }
    thead th:first-child { text-align:right; }
    tbody tr:nth-child(even) { background:#f8fafc; }
    tbody tr:hover { background:#f1f5f9; }
    .totals { margin-top:8px; margin-right:auto; width:280px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; }
    .totals .tot-row { display:flex; justify-content:space-between; padding:8px 14px; font-size:13px; border-bottom:1px solid #e2e8f0; }
    .totals .tot-row:last-child { background:#1e293b; color:#fff; font-size:16px; font-weight:800; border-bottom:none; }
    .footer { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
    .stamp-area { margin-top:40px; display:flex; justify-content:space-between; }
    .stamp-box { border-top:1px solid #000; min-width:180px; padding-top:6px; font-size:12px; color:#555; text-align:center; }
    @media print { body { padding:15px; } @page { margin:10mm; size:A4 portrait; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${companyName}</h1>
      ${vatNumber      ? `<p>الرقم الضريبي: ${vatNumber}</p>` : ''}
      ${crNumber       ? `<p>السجل التجاري: ${crNumber}</p>` : ''}
      ${companyAddress ? `<p>العنوان: ${companyAddress}</p>` : ''}
      ${companyCity    ? `<p>المدينة: ${companyCity}</p>` : ''}
    </div>
    <div class="quote-info">
      <div class="title">عرض سعر / Quotation</div>
      <div class="row"><span>رقم ط§ظ„عرض:</span><span>#${quote.quoteNo}</span></div>
      <div class="row"><span>التاريخ:</span><span>${new Date(quote.date).toLocaleDateString('ar-SA')}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:right; padding:10px 8px;">المنتج / Description</th>
        <th>الكمية / Qty</th>
        <th>سعر الوحدة / Unit Price</th>
        <th>الإجمالي / Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="tot-row"><span>ط§ظ„ظ…ط¬ظ…ظˆط¹ ظ‚ط¨ظ„ ط§ظ„ضريبة</span><span>${fmt(sub)}</span></div>
    <div class="tot-row"><span>ضريبة القيمة المضافة (${rate}%)</span><span>${fmt(tax)}</span></div>
    <div class="tot-row"><span>الإجمالي الكلي</span><span>${fmt(grand)} ط±ظٹط§ظ„</span></div>
  </div>

  ${notesLine}

  <div class="stamp-area">
    <div class="stamp-box">طھظˆظ‚ظٹط¹ ط§ظ„ظ…ظˆط±ط¯ / Supplier Signature</div>
    <div class="stamp-box">طھظˆظ‚ظٹط¹ العميل / Customer Signature</div>
  </div>

  <div class="footer">
    ظ‡ط°ط§ ط§ظ„عرض طµط§ظ„ط­ ظ„ظ…ط¯ط© 30 ظٹظˆظ…ط§ظ‹ ظ…ظ† تاريخ الإصدار â€” This quotation is valid for 30 days from issue date
  </div>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 400); }</script>
</body>
</html>`);
        win.document.close();
    };

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    //  تحويل عرض ط§ظ„سعر ط¥ظ„ظ‰ فاتورة مبيعات
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    const convertToInvoice = async (quote: Quote) => {
        setConverting(true);
        try {
            const token = window.localStorage.getItem('token');
            const meRes = token ? await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }) : null;
            const me    = meRes?.ok ? await meRes.json() : null;
            const userId = me?.user?.id || null;

            const salesItems = quote.details.map(d => ({
                productId:   null, // لا ظٹظˆط¬ط¯ productId ظپظٹ ط¹ط±ظˆط¶ الأسعار
                productName: d.productName,
                quantity:    d.quantity,
                price:       d.price,
                discountRate: 0,
            }));

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: salesItems,
                    paymentType,
                    taxRate,
                    isTaxInclusive: false, // الأسعار ظپظٹ DB ظ…ط¬ط±ط¯ط© ط¨ط¯ظˆظ† ضريبة
                    notes: `ظ…ط­ظˆظ„ ظ…ظ† عرض سعر #${quote.quoteNo}`,
                    userId,
                    paid: quote.total * (1 + taxRate / 100),
                }),
            });

            if (res.ok) {
                const inv = await res.json();
                setConvertingId(null);
                alert(`âœ… طھظ… ط¥ظ†ط´ط§ط، الفاتورة رقم #${inv.invoiceNo} ط¨ظ†ط¬ط§ط­!`);
                // طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„عرض
                await fetch(`/api/price-quotes?id=${quote.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' }),
                }).catch(() => {});
                load();
            } else {
                const err = await res.json();
                alert(`â‌Œ ظپط´ظ„ ط§ظ„تحويل: ${err.error || 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}`);
            }
        } catch (e: any) {
            alert(`â‌Œ ط®ط·ط£: ${e.message}`);
        }
        setConverting(false);
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string; bg: string }> = {
            pending:  { label: 'ظ‚ظٹط¯ الانتظار', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
            approved: { label: 'ظ…ط¹طھظ…ط¯',         color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
            rejected: { label: 'ظ…ط±ظپظˆط¶',         color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
        };
        const s = map[status] || { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
        return (
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', color: s.color, background: s.bg }}>
                {s.label}
            </span>
        );
    };

    return (<>
        <div className="page-header">
            <h1 className="page-title">ًں“‹ {t('sys.str_1265') || 'ط¹ط±ظˆط¶ الأسعار'}</h1>
        </div>
        <div className="page-content animate-fade-in">

            {/* Toolbar */}
            <div className="toolbar" style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{quotes.length} عرض</span>
                <div className="toolbar-spacer" />
                <button className="btn btn-primary" onClick={() => { setShowAdd(true); setItems([]); }}>
                    + عرض سعر جديد
                </button>
            </div>

            {/* ظ†ظ…ظˆط°ط¬ ط§ظ„إضافة */}
            {showAdd && (
                <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
                    <h3 style={{ marginBottom: '14px', fontSize: '16px', fontWeight: '700' }}>ًں“‌ ط¥ظ†ط´ط§ط، عرض سعر جديد</h3>

                    {/* بحث ط¹ظ† المنتج */}
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <input
                            ref={searchRef}
                            value={searchText}
                            onChange={e => { setSearchText(e.target.value); setShowSearch(true); }}
                            onFocus={() => setShowSearch(true)}
                            placeholder="ًں”چ ط§بحث ط¹ظ† منتج ط£ظˆ ط£ط¯ط®ظ„ ط§ط³ظ…ظ‡..."
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '2px solid var(--primary)', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text)' }}
                        />
                        {showSearch && searchText && filteredProducts.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxHeight: '250px', overflowY: 'auto' }}>
                                {filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => addProduct(p)}
                                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <span>{p.name}</span>
                                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{fmt(p.sellPrice)} ط±.ط³</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ط¬ط¯ظˆظ„ ط§ظ„ط£طµظ†ط§ظپ */}
                    {items.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(108,99,255,0.08)' }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>ط§ظ„طµظ†ظپ</th>
                                        <th style={{ padding: '8px', textAlign: 'center', width: '90px', color: 'var(--text-secondary)' }}>الكمية</th>
                                        <th style={{ padding: '8px', textAlign: 'center', width: '110px', color: 'var(--text-secondary)' }}>ط§ظ„سعر</th>
                                        <th style={{ padding: '8px', textAlign: 'center', width: '110px', color: 'var(--text-secondary)' }}>الإجمالي</th>
                                        <th style={{ width: '36px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '4px 6px' }}>
                                                <input value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                                                    placeholder="ط§ط³ظ… ط§ظ„طµظ†ظپ"
                                                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }} />
                                            </td>
                                            <td style={{ padding: '4px' }}>
                                                <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                                                    style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg-card)', color: 'var(--text)' }} />
                                            </td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text)' }}>
                                                <input type="number" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                                                    style={{ width: '95px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'monospace' }} />
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>
                                                {fmt(item.quantity * item.price)}
                                            </td>
                                            <td style={{ padding: '4px' }}>
                                                <button onClick={() => removeItem(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>âœ•</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* الإجمالي */}
                    {items.length > 0 && (
                        <div style={{ background: 'rgba(108,99,255,0.06)', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                <span>ط§ظ„ظ…ط¬ظ…ظˆط¹ ظ‚ط¨ظ„ ط§ظ„ضريبة</span><span style={{ fontFamily: 'monospace' }}>{fmt(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                <span>ضريبة القيمة المضافة ({taxRate}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(taxValue)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                                <span>الإجمالي الكلي</span><span style={{ fontFamily: 'monospace' }}>{fmt(total)} ط±.ط³</span>
                            </div>
                        </div>
                    )}

                    {/* ط§ظ„ط£ط²ط±ط§ط± */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={addManualItem}>+ طµظ†ظپ ظٹط¯ظˆظٹ</button>
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ظ…لاط­ط¸ط§طھ..."
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '150px', background: 'var(--bg-card)', color: 'var(--text)' }} />
                        <button className="btn btn-sm" style={{ background: 'var(--bg-card-hover)' }} onClick={() => setShowAdd(false)}>إلغاء</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={items.length === 0}>ًں’¾ حفظ ظˆطباعة</button>
                    </div>
                </div>
            )}

            {/* ظ‚ط§ط¦ظ…ط© العروض */}
            <div className="card" style={{ padding: '0' }}>
                {loading ? (
                    <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div>
                ) : quotes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">ًں“„</div>
                        <div className="empty-state-text">لا طھظˆط¬ط¯ ط¹ط±ظˆط¶ ط£ط³ط¹ط§ط± ط¨ط¹ط¯</div>
                    </div>
                ) : (
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {quotes.map(q => (
                            <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                {/* ط±ط£ط³ ط§ظ„عرض */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', cursor: 'pointer', borderBottom: expanded === q.id ? '1px solid var(--border)' : 'none' }}
                                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '800', fontSize: '15px' }}>#{q.quoteNo}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(q.date).toLocaleDateString('ar-SA')}</span>
                                    {statusBadge(q.status)}
                                    {q.notes && <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ًں“‌ {q.notes}</span>}
                                    <div className="toolbar-spacer" />
                                    <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>{fmt(q.total * (1 + taxRate / 100))} ط±.ط³</span>

                                    {/* ط²ط± الطباعة */}
                                    <button onClick={e => { e.stopPropagation(); printQuoteA4(q); }}
                                        title="طباعة عرض ط§ظ„سعر A4"
                                        style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'Lateef' }}>
                                        ًں–¨ï¸ڈ طباعة
                                    </button>

                                    {/* ط²ط± تحويل ظ„فاتورة */}
                                    {q.status !== 'approved' && (
                                        <button onClick={e => { e.stopPropagation(); setConvertingId(q.id); setPaymentType('cash'); }}
                                            title="تحويل ط¥ظ„ظ‰ فاتورة مبيعات"
                                            style={{ padding: '6px 12px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'Lateef' }}>
                                            âœ… تحويل ظ„فاتورة
                                        </button>
                                    )}

                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', transition: 'transform 0.2s', transform: expanded === q.id ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>â–¼</span>
                                </div>

                                {/* طھظپط§طµظٹظ„ ط§ظ„عرض */}
                                {expanded === q.id && q.details && (
                                    <div style={{ padding: '12px 14px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                                    <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>ط§ظ„طµظ†ظپ</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>الكمية</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>ط§ظ„سعر</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>الإجمالي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {q.details.map((d, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '8px', color: 'var(--text)' }}>{d.productName}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text)' }}>{d.quantity}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text)' }}>{fmt(d.price)}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{fmt(d.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {/* ط¥ط¬ظ…ط§ظ„ظٹط§طھ ط¯ط§ط®ظ„ ط§ظ„طھظپط§طµظٹظ„ */}
                                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ظ‚ط¨ظ„ ط§ظ„ضريبة: <b style={{ fontFamily: 'monospace' }}>{fmt(q.total)}</b></span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ط§ظ„ضريبة: <b style={{ fontFamily: 'monospace' }}>{fmt(q.total * taxRate / 100)}</b></span>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>الإجمالي: <b style={{ fontFamily: 'monospace' }}>{fmt(q.total * (1 + taxRate / 100))} ط±.ط³</b></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* â•گâ•گâ•گâ•گ ظ…ظˆط¯ط§ظ„ تحويل ظ„فاتورة â•گâ•گâ•گâ•گ */}
        {convertingId !== null && (() => {
            const q = quotes.find(x => x.id === convertingId);
            if (!q) return null;
            const grand = q.total * (1 + taxRate / 100);
            return (
                <div className="modal-overlay" onClick={() => !converting && setConvertingId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">âœ… تحويل عرض سعر #${q.quoteNo} ط¥ظ„ظ‰ فاتورة</h2>
                            <button onClick={() => setConvertingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}>âœ•</button>
                        </div>

                        {/* ظ…ظ„ط®طµ ط§ظ„عرض */}
                        <div style={{ background: 'rgba(108,99,255,0.06)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                <span>ط¹ط¯ط¯ ط§ظ„ط£طµظ†ط§ظپ</span><span>{q.details.length} طµظ†ظپ</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                <span>ظ‚ط¨ظ„ ط§ظ„ضريبة</span><span style={{ fontFamily: 'monospace' }}>{fmt(q.total)} ط±.ط³</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                <span>ط§ظ„ضريبة ({taxRate}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(q.total * taxRate / 100)} ط±.ط³</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '800', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                                <span>الإجمالي</span><span style={{ fontFamily: 'monospace' }}>{fmt(grand)} ط±.ط³</span>
                            </div>
                        </div>

                        {/* ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹ */}
                        <div className="input-group">
                            <label className="input-label">ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹</label>
                            <select className="input" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                                <option value="cash">نقدي</option>
                                <option value="card">بطاقة</option>
                                <option value="transfer">تحويل بنكي</option>
                                <option value="credit">آجل</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => setConvertingId(null)} className="btn btn-ghost" style={{ flex: 1 }} disabled={converting}>
                                إلغاء
                            </button>
                            <button onClick={() => convertToInvoice(q)} className="btn btn-success" style={{ flex: 2 }} disabled={converting}>
                                {converting ? 'âڈ³ جاري ط§ظ„تحويل...' : 'âœ… ط¥ظ†ط´ط§ط، الفاتورة'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        })()}
    </>);
}

