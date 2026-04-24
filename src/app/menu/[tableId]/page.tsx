'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Send, X, ChefHat, Utensils, Receipt, BellRing } from 'lucide-react';

export default function PublicMenuPage({ params }: { params: Promise<{ tableId: string }> }) {
    const [tableId, setTableId] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('الكل');
    const [cart, setCart] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orderSent, setOrderSent] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderTotal, setOrderTotal] = useState(0);
    const [sending, setSending] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');
    const [tableName, setTableName] = useState('');
    const [waiterCalled, setWaiterCalled] = useState(false);

    useEffect(() => {
        params.then(p => {
            setTableId(p.tableId);
            // Fetch table name from public API
            fetch(`/api/public/table?tableId=${p.tableId}`).then(r => r.json()).then(data => {
                if (data.success && data.table) {
                    setTableName(data.table.name);
                }
            }).catch(() => {});
        });
    }, [params]);

    useEffect(() => { fetchMenu(); }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/public/menu');
            const data = await res.json();
            if (data.success) {
                setCompanyName(data.companyName);
                setProducts(data.products || []);
                setCategories([{ id: 'all', name: 'الكل' }, ...(data.categories || [])]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredProducts = products.filter(p =>
        activeCategory === 'الكل' || p.categoryId === activeCategory || p.categoryName === activeCategory
    );

    const addToCart = (product: any) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = i.qty + delta;
                if (newQty <= 0) return null;
                return { ...i, qty: newQty };
            }
            return i;
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((a, i) => a + (i.price * i.qty), 0);
    const cartCount = cart.reduce((a, i) => a + i.qty, 0);
    const tax = cartTotal * 0.15;
    const grandTotal = cartTotal + tax;

    // Step 1: Show cart → Step 2: Show confirmation with total → Step 3: Send
    const proceedToConfirm = () => {
        if (cart.length === 0) return;
        setShowCart(false);
        setShowConfirm(true);
    };

    const sendOrder = async () => {
        if (cart.length === 0) return;
        setSending(true);
        try {
            const res = await fetch('/api/public/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableId: tableId !== '0' ? tableId : null,
                    tableName: tableName || tableId,
                    items: cart.map(i => ({ id: i.id, qty: i.qty, name: i.name, price: i.price })),
                    customerName,
                    notes
                })
            });
            const data = await res.json();
            if (data.success) {
                setOrderSent(true);
                setOrderNumber(data.orderNumber);
                setOrderTotal(grandTotal);
                setCart([]);
                setShowConfirm(false);
            } else {
                alert(data.error || 'حدث خطأ');
            }
        } catch {
            alert('حدث خطأ في الاتصال');
        } finally {
            setSending(false);
        }
    };

    // ═══════════════ ORDER CONFIRMED SCREEN ═══════════════
    if (orderSent) {
        return (
            <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans Arabic', sans-serif", padding: '1rem' }}>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                    <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChefHat size={40} color="white" />
                    </div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>تم استلام طلبك! 🎉</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>رقم الطلب</p>
                    <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                        <span style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 900 }}>#{orderNumber}</span>
                    </div>
                    {tableName && (
                        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>🍽️ الطاولة</span>
                            <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.2rem' }}>{tableName}</span>
                        </div>
                    )}
                    <div style={{ background: '#0f172a', borderRadius: '12px', padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>الإجمالي</span>
                        <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.2rem' }}>{orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.8 }}>
                        طلبك بانتظار موافقة الكاشير...<br/>سيتم تجهيزه فور الموافقة ☕
                    </p>
                    <button onClick={() => { setOrderSent(false); setOrderNumber(''); setOrderTotal(0); }} style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        طلب جديد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Noto Sans Arabic', sans-serif", paddingBottom: cartCount > 0 ? '100px' : '2rem' }}>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '1.5rem 1rem', borderBottom: '1px solid #334155' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Utensils size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{companyName || 'المنيو'}</h1>
                        {tableName && <p style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>🍽️ طاولة {tableName}</p>}
                    </div>
                    <button onClick={async () => {
                        if (waiterCalled) return;
                        setWaiterCalled(true);
                        try {
                            await fetch('/api/public/call-waiter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tableId, tableName: tableName || tableId }) });
                        } catch (e) {}
                        setTimeout(() => setWaiterCalled(false), 30000);
                    }} style={{ marginRight: 'auto', background: waiterCalled ? '#22c55e' : 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', padding: '0.5rem 1rem', cursor: waiterCalled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', animation: waiterCalled ? 'none' : 'bellShake 2s ease-in-out infinite' }}>
                        <BellRing size={18} />
                        {waiterCalled ? '✓ تم الاستدعاء' : 'استدعاء النادل'}
                    </button>
                    <style>{`@keyframes bellShake { 0%,100%{transform:rotate(0)} 10%,30%{transform:rotate(-5deg)} 20%,40%{transform:rotate(5deg)} 50%{transform:rotate(0)} }`}</style>
                </div>
            </div>

            {/* Categories */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', overflowX: 'auto', display: 'flex', gap: '0.5rem' }}>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.name === 'الكل' ? 'الكل' : cat.id)}
                        style={{ whiteSpace: 'nowrap', padding: '0.5rem 1.25rem', borderRadius: '20px', border: 'none',
                            background: (activeCategory === cat.id || (activeCategory === 'الكل' && cat.name === 'الكل')) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b',
                            color: (activeCategory === cat.id || (activeCategory === 'الكل' && cat.name === 'الكل')) ? 'white' : '#94a3b8',
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Products */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>جاري تحميل المنيو...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredProducts.map(product => {
                            const inCart = cart.find(i => i.id === product.id);
                            return (
                                <div key={product.id} style={{ background: '#1e293b', borderRadius: '16px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', border: inCart ? '2px solid #f59e0b' : '1px solid #334155', transition: 'all 0.2s' }}>
                                    <div style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#334155' }}>
                                        {product.img && product.img.length > 2 && (product.img.startsWith('/') || product.img.startsWith('http'))
                                            ? <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 900, fontSize: '1.2rem' }}>{product.name?.substring(0, 2)}</div>
                                        }
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{product.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{product.categoryName}</div>
                                        <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.1rem', marginTop: '0.25rem' }}>{product.price?.toLocaleString()} ر.س</div>
                                    </div>
                                    {inCart ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => updateQty(product.id, -1)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                                            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>{inCart.qty}</span>
                                            <button onClick={() => addToCart(product)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart(product)} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={22} /></button>
                                    )}
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>لا توجد أصناف</div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Floating Cart Button ═══ */}
            {cartCount > 0 && !showConfirm && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, #0f172a, transparent)', zIndex: 100 }}>
                    <button onClick={() => setShowCart(true)} style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 1.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 -4px 20px rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.4rem 0.75rem', fontWeight: 900 }}>{cartCount}</div>
                            <span>عرض السلة</span>
                        </div>
                        <span style={{ fontWeight: 900 }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                    </button>
                </div>
            )}

            {/* ═══ Cart Drawer ═══ */}
            {showCart && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCart(false)}>
                    <div style={{ background: '#1e293b', width: '100%', maxWidth: '600px', borderRadius: '24px 24px 0 0', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', margin: 0 }}>🛒 طلبك</h3>
                            <button onClick={() => setShowCart(false)} style={{ background: '#334155', border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                        </div>

                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #334155' }}>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>{(item.price * item.qty).toLocaleString()} ر.س</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>-</button>
                                    <span style={{ color: 'white', fontWeight: 900, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                    <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        ))}

                        <input type="text" placeholder="اسمك (اختياري)" value={customerName} onChange={e => setCustomerName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', marginTop: '1rem', outline: 'none', fontSize: '0.95rem' }} />
                        <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', marginTop: '0.5rem', outline: 'none', fontSize: '0.95rem', resize: 'none' }} />

                        {/* Go to confirmation */}
                        <button onClick={proceedToConfirm} disabled={cart.length === 0}
                            style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Receipt size={20} /> عرض الحساب
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ CONFIRMATION SCREEN - الحساب الكامل ═══ */}
            {showConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#1e293b', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Receipt size={40} color="#f59e0b" />
                            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', margin: '0.75rem 0 0.25rem' }}>الحساب</h2>
                            {tableName && <p style={{ color: '#f59e0b', fontWeight: 'bold', margin: 0 }}>🍽️ طاولة {tableName}</p>}
                        </div>

                        {/* Order Items */}
                        <div style={{ background: '#0f172a', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
                            {cart.map((item, i) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < cart.length - 1 ? '1px solid #1e293b' : 'none' }}>
                                    <div>
                                        <span style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</span>
                                        <span style={{ color: '#64748b', marginRight: '0.5rem' }}>×{item.qty}</span>
                                    </div>
                                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} ر.س</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div style={{ background: '#0f172a', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8' }}>
                                <span>المجموع</span><span>{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                <span>ضريبة القيمة المضافة 15%</span><span>{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.4rem', color: '#22c55e', borderTop: '2px solid #334155', paddingTop: '0.75rem' }}>
                                <span>الإجمالي</span><span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                            </div>
                        </div>

                        {customerName && (
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>👤 {customerName}</div>
                        )}
                        {notes && (
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>📝 {notes}</div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => { setShowConfirm(false); setShowCart(true); }} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                تعديل
                            </button>
                            <button onClick={sendOrder} disabled={sending}
                                style={{ flex: 2, padding: '1rem', borderRadius: '14px', border: 'none', background: sending ? '#64748b' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Send size={20} />
                                {sending ? 'جاري الإرسال...' : '✓ تأكيد الطلب'}
                            </button>
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
                            سيتم إرسال الطلب للكاشير للموافقة عليه
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
