const fs = require('fs');

let c = fs.readFileSync('src/app/(dashboard)/purchases/page.tsx', 'utf8');

// 1. Add States
c = c.replace(
    /const \[supplierInvoiceNo, setSupplierInvoiceNo\] = useState\(''\);/,
    `const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
    const [isManual, setIsManual] = useState(false);
    const [manualSubtotal, setManualSubtotal] = useState('');
    const [manualTaxValue, setManualTaxValue] = useState('');`
);

// 2. Modify Calculations
const calcTarget = `const subtotal = cart.reduce((s, item) => { const t = item.quantity * item.price; return s + t - t * (item.discountRate / 100); }, 0);
    const taxValue = subtotal * 0.15;
    const total = subtotal + taxValue;
    const actualPaid = paymentType === 'credit' ? (parseFloat(paidAmount) || 0) : total;`;

const calcReplacement = `const calculatedSubtotal = cart.reduce((s, item) => { const t = item.quantity * item.price; return s + t - t * (item.discountRate / 100); }, 0);
    const subtotal = isManual ? (parseFloat(manualSubtotal) || 0) : calculatedSubtotal;
    const taxValue = isManual ? (parseFloat(manualTaxValue) || 0) : subtotal * 0.15;
    const total = subtotal + taxValue;
    const actualPaid = paymentType === 'credit' ? (parseFloat(paidAmount) || 0) : total;
    
    const totalItems = cart.length;
    const totalUnits = cart.reduce((s, item) => s + item.quantity, 0);`;

c = c.replace(calcTarget, calcReplacement);

// 3. Modify handleSave Payload
c = c.replace(
    /body: JSON\.stringify\(\{ supplierId: supplierId \|\| null, stockId: stockId \|\| '1', items: cart, paymentType, supplierInvoiceNo, paid: actualPaid, userId: user\.id, notes \}\),/,
    `body: JSON.stringify({ isManual, manualSubtotal: parseFloat(manualSubtotal) || 0, manualTaxValue: parseFloat(manualTaxValue) || 0, supplierId: supplierId || null, stockId: stockId || '1', items: cart, paymentType, supplierInvoiceNo, paid: actualPaid, userId: user.id, notes }),`
);

// 4. Modify handleSave Clear
c = c.replace(
    /setCart\(\[\]\); setNotes\(''\); setSupplierId\(''\); setSupplierInvoiceNo\(''\); setPaidAmount\(''\); setPaymentType\('cash'\); fetchAll\(\);/,
    `setCart([]); setNotes(''); setSupplierId(''); setSupplierInvoiceNo(''); setPaidAmount(''); setPaymentType('cash'); setIsManual(false); setManualSubtotal(''); setManualTaxValue(''); fetchAll();`
);

// 5. Add Toggle UI & Table Logic
const toggleUI = `<div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                                <button className={\`btn \${!isManual ? 'btn-primary' : 'btn-ghost'}\`} onClick={() => setIsManual(false)} style={{ flex: 1, fontWeight: 'bold' }}>فاتورة المشتريات (القياسية)</button>
                                <button className={\`btn \${isManual ? 'btn-primary' : 'btn-ghost'}\`} onClick={() => setIsManual(true)} style={{ flex: 1, fontWeight: 'bold' }} title="لا يؤثر على أسعار وتقييم المنتجات المخزنية">فاتورة المشتريات (اليدوية)</button>
                            </div>
                            
                            {isManual && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px' }}>إجمالي الفاتورة الصافي (قبل الضريبة)</label>
                                        <input className="input" type="number" value={manualSubtotal} onChange={e => setManualSubtotal(e.target.value)} placeholder="0.00" dir="ltr" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px' }}>مبلغ الضريبة</label>
                                        <input className="input" type="number" value={manualTaxValue} onChange={e => setManualTaxValue(e.target.value)} placeholder="0.00" dir="ltr" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        * في الفاتورة اليدوية، سيتم إضافة كميات الأصناف المدرجة في الجدول إلى المخزون (بدون قيمة محاسبية)، وذلك للتسوية والجرد. سيتم احتساب قيمة الفاتورة الكلية فقط في حساب المورد.
                                    </div>
                                </div>
                            )}`;

c = c.replace(/<div className="pos-invoice-header">/, toggleUI + '\n<div className="pos-invoice-header">');

// 6. Modify Table Headers to conditionally hide Columns
const headerTarget = `<thead><tr><th>{t('sys.str_63')}</th><th style={{ width: '80px' }}>{t('sys.str_64')}</th><th style={{ width: '100px' }}>{t('sys.str_65')}</th><th style={{ width: '80px' }}>{t('sys.str_766')}</th><th style={{ width: '100px' }}>{t('sys.str_66')}</th><th style={{ width: '40px' }}></th></tr></thead>`;
const headerReplacement = `<thead><tr><th>{t('sys.str_63')}</th><th style={{ width: '80px' }}>{t('sys.str_64')}</th>{!isManual && <th style={{ width: '100px' }}>{t('sys.str_65')}</th>}{!isManual && <th style={{ width: '80px' }}>{t('sys.str_766')}</th>}{!isManual && <th style={{ width: '100px' }}>{t('sys.str_66')}</th>}<th style={{ width: '40px' }}></th></tr></thead>`;
c = c.replace(headerTarget, headerReplacement);

// 7. Modify Table Body to conditionally hide Columns
const bodyTarget = `<td style={{ fontWeight: '600', fontSize: '13px' }}>{item.productName}</td>
                                                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td><input className="input" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td><input className="input" type="number" min="0" max="100" value={item.discountRate} onChange={e => updateItem(idx, 'discountRate', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td style={{ fontWeight: '600' }}>{fmt(iTotal)}</td>
                                                    <td><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button></td>`;
                                                    
const bodyReplacement = `<td style={{ fontWeight: '600', fontSize: '13px' }}>{item.productName}</td>
                                                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    {!isManual && <td><input className="input" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>}
                                                    {!isManual && <td><input className="input" type="number" min="0" max="100" value={item.discountRate} onChange={e => updateItem(idx, 'discountRate', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>}
                                                    {!isManual && <td style={{ fontWeight: '600' }}>{fmt(iTotal)}</td>}
                                                    <td><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button></td>`;
c = c.replace(bodyTarget, bodyReplacement);

// 8. Add Counter line to footer
const counterHtml = `<div className="pos-total-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '4px' }}>
                                        <span>عداد الأصناف</span>
                                        <span style={{ fontWeight: 'normal', fontSize: '13px' }}>{totalItems} أصناف / {totalUnits} حبة</span>
                                    </div>`;
c = c.replace(/<div className="pos-total-row"><span>\{t\('sys\.str_947'\)\}/, counterHtml + '\n                                    <div className="pos-total-row"><span>{t(\'sys.str_947\')}');

// Add "يدوي" badge to pending / receipt tables
const pendingTarget = `<td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>`;
const pendingReplacement = `<td style={{ fontWeight: '700' }}>#{inv.invoiceNo} {inv.isManual && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginRight: '4px' }}>يدوي</span>}</td>`;
// Wait, the API doesn't select isManual? 
// Let's modify the GET call in API separately below or next. 
// TypeScript won't know `inv.isManual` unless I add it to the Interface.
c = c.replace(/interface PurchaseInvoice \{ id: number; invoiceNo: number; date: string; total: number; paid: number; remaining: number; status: string; paymentType: string; receiptStatus\?: string; supplier\?: \{ name: string \} \| null; \}/,
              `interface PurchaseInvoice { id: number; invoiceNo: number; isManual?: boolean; date: string; total: number; paid: number; remaining: number; status: string; paymentType: string; receiptStatus?: string; supplier?: { name: string } | null; }`);
c = c.replace(/<td style=\{\{ fontWeight: '700' \}\}>#\{inv\.invoiceNo\}<\/td>/g, pendingReplacement); // Replaces globally


fs.writeFileSync('src/app/(dashboard)/purchases/page.tsx', c);
console.log('UI Patched');
