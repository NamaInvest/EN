const fs = require('fs');
let code = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');

// 1. Action Bar
code = code.replace(/<div className="top-bar">[\s\S]*?<\/div>\s*<input/, 
`<div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
                    <div className="nav-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Link href="/dashboard" className="btn-back" style={{ padding: '0.5rem', textDecoration: 'none', background: '#e2e8f0', borderRadius: '6px', color: '#64748b' }}>
                            <ArrowRight size={18} />
                        </Link>
                        <button className="btn-back" onClick={() => { setCart([]); setSelectedCustomer(null); removeCoupon(); }} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>📄 جديدة</button>
                        <button id="pos-hold-btn" className="btn-back" onClick={handleHoldOrder} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#d97706', fontWeight: 'bold', cursor: 'pointer' }}>⏸️ تعليق</button>
                        <button className="btn-back" onClick={() => setShowHeldOrdersModal(true)} style={{ padding: '0.5rem 1rem', background: heldOrders.length > 0 ? '#fef3c7' : '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: heldOrders.length > 0 ? '#d97706' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>
                            ▶️ استرجاع ({heldOrders.length})
                        </button>
                        <button className="btn-back" onClick={() => { if(confirm('إلغاء الفاتورة؟')) { setCart([]); setSelectedCustomer(null); removeCoupon(); } }} style={{ padding: '0.5rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>🚫 إلغاء</button>
                        <button id="pos-history-btn" className="btn-back" onClick={fetchRecentOrders} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>📋 الفواتير</button>
                        <Link href="/sales-returns" className="btn-back" style={{ padding: '0.5rem 1rem', background: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>🔙 مرتجعات المبيعات</Link>
                    </div>
                    <input`);

// 2. Qty Input
code = code.replace(/<button className="qty-circle" onClick={\(\) => updateQty\(item\.id, -1\)}>-<\/button>\s*<span>\{item\.qty\}<\/span>/,
`<button className="qty-circle" onClick={() => updateQty(item.id, -1)}>-</button>
                                            <input className="pos-qty-input" type="number" value={item.qty} onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val > 0) setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: val } : i));
                                            }} style={{ width: '40px', background: 'transparent', border: 'none', color: '#333', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} />`);

// 3. Numpad
code = code.replace(/<div className="numpad-section">[\s\S]*?<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>[\s\S]*?MADA ✔<\/span>\s*<\/button>\s*<\/div>\s*<\/div>/,
`<div className="numpad-section">
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.5rem' }}>
                        <button id="pos-pay-cash-btn" className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CASH')} style={{ background: '#22c55e', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>💵 نقدي</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CARD')} style={{ background: '#3b82f6', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>💳 مدى</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('TRANSFER')} style={{ background: '#8b5cf6', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🏦 تحويل</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => {
                            const val = prompt('المبلغ النقدي:');
                            if (val) handleCheckout('SPLIT');
                        }} style={{ background: '#f59e0b', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✂️ مقسوم</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => { alert('سيتم التحويل لتابي'); }} style={{ background: '#3eedbf', color: '#111', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Tabby</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => { alert('سيتم التحويل لتمارا'); }} style={{ background: '#ffb5a3', color: '#111', fontSize: '1.2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Tamara</span>
                        </button>
                    </div>
                </div>`);

// 4. Hotkeys Text
code = code.replace(/<span>\{t\('sys\.str_4101'\)\}<\/span>/,
`<span>⌨️ <strong>اختصارات الكيبورد:</strong> <kbd>F2</kbd> الدفع النقدي | <kbd>F3</kbd> تعليق | <kbd>F4</kbd> الفواتير | <kbd>F8</kbd> التركيز للكمية | <kbd>F9</kbd> حفظ</span>`);

// Remove "as any" from bnpl handleCheckout if exists
code = code.replace(/handleCheckout\(bnplProvider\.toUpperCase\(\) as any\)/g, 'handleCheckout(bnplProvider.toUpperCase())');

// Make sure handleCheckout takes string instead of literal union
code = code.replace(/const handleCheckout = async \(type: 'CASH' \| 'CARD' \| 'TRANSFER' \| 'SPLIT'\) => \{/, 'const handleCheckout = async (type: string) => {');

fs.writeFileSync('src/app/restaurant-pos/page.tsx', code);
console.log('patched');
