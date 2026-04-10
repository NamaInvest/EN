const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/purchases/page.tsx', 'utf8');

const t1 = `    const remaining = total - actualPaid;\r
    const fmt = (v: number) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\r
\r
    const handleSave = async () => {`;
const r1 = `    const remaining = total - actualPaid;\r
    const fmt = (v: number) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\r
\r
    const totalItems = cart.length;\r
    const totalUnits = cart.reduce((s, item) => s + (Number(item.quantity) || 0), 0);\r
\r
    const handleSave = async () => {`;

const t2 = `                                                    <td style={{ fontWeight: '600', fontSize: '13px' }}>{item.productName}</td>\r
                                                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>\r
                                                    <td><input className="input" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>\r
                                                    <td><input className="input" type="number" min="0" max="100" value={item.discountRate} onChange={e => updateItem(idx, 'discountRate', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>\r
                                                    <td style={{ fontWeight: '600' }}>{fmt(iTotal)}</td>\r
                                                    <td><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button></td>`;
const r2 = `                                                    <td style={{ fontWeight: '600', fontSize: '13px' }}>{item.productName}</td>\r
                                                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>\r
                                                    {!isManual && <td><input className="input" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>}\r
                                                    {!isManual && <td><input className="input" type="number" min="0" max="100" value={item.discountRate} onChange={e => updateItem(idx, 'discountRate', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>}\r
                                                    {!isManual && <td style={{ fontWeight: '600' }}>{fmt(iTotal)}</td>}\r
                                                    <td><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button></td>`;

if(content.includes(t1)) { content = content.replace(t1, r1); console.log('Replaced chunk 1'); } else { console.log('Failed to find chunk 1'); }
if(content.includes(t2)) { content = content.replace(t2, r2); console.log('Replaced chunk 2'); } else { console.log('Failed to find chunk 2'); }

// fallback for \n instead of \r\n
const t3 = t1.replace(/\r\n/g, '\n');
const r3 = r1.replace(/\r\n/g, '\n');
const t4 = t2.replace(/\r\n/g, '\n');
const r4 = r2.replace(/\r\n/g, '\n');

if(content.includes(t3)) { content = content.replace(t3, r3); console.log('Replaced chunk 1 (LF)'); }
if(content.includes(t4)) { content = content.replace(t4, r4); console.log('Replaced chunk 2 (LF)'); }

fs.writeFileSync('src/app/(dashboard)/purchases/page.tsx', content);
