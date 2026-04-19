'use client';

import React, { useState, useEffect } from 'react';
import PosReturnsModal from '@/components/PosReturnsModal';
import { useMadaTerminal } from '@/hooks/useMadaTerminal';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Grid, Trash2, Clock, History, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import InvoiceReceipt from '@/components/InvoiceReceipt';

export default function POSPage() {
    const { t, lang } = useTranslation();
    const isRTL = lang === 'ar';

    const [searchQuery, setSearchQuery] = useState('');
    const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();
    const [cart, setCart] = useState<any[]>([]);
    const [showReturnsModal, setShowReturnsModal] = useState(false);

    const [taxRate, setTaxRate] = useState(15);
    
    // Coupons Engine State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Customer Selector State
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [completedInvoiceId, setCompletedInvoiceId] = useState<number | null>(null);

    // Split Payment State
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitCash, setSplitCash] = useState('');
    const [splitCard, setSplitCard] = useState('');

    // Hold & History State
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const initSettings = async () => { try { const res = await fetch('/api/settings'); if (res.ok) { const data = await res.json(); if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0); } } catch (e) {} }; useEffect(() => { initSettings(); }, []);
    useEffect(() => {
        const saved = localStorage.getItem('pos_held_orders');
        if (saved) {
            try { setHeldOrders(JSON.parse(saved)); } catch (e) {}
        }
    }, []);

    const saveHeldOrders = (orders: any[]) => {
        setHeldOrders(orders);
        localStorage.setItem('pos_held_orders', JSON.stringify(orders));
    };

    const handleHoldOrder = () => {
        if (cart.length === 0) return;
        const newOrder = {
            id: Date.now().toString(),
            cart: [...cart],
            total: cart.reduce((acc, item) => acc + (item.price * item.qty), 0),
            customer: selectedCustomer,
            time: new Date().toLocaleTimeString('ar-SA')
        };
        saveHeldOrders([...heldOrders, newOrder]);
        setCart([]);
        setSelectedCustomer(null);
        removeCoupon();
        alert(t('sys.str_4064'));
    };

    const handleRestoreOrder = (order: any) => {
        setCart(order.cart);
        setSelectedCustomer(order.customer);
        const newOrders = heldOrders.filter(o => o.id !== order.id);
        saveHeldOrders(newOrders);
        setShowHeldOrdersModal(false);
    };

    const fetchRecentOrders = async () => {
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/sales?limit=15'); 
            const data = await res.json();
            setRecentOrders(Array.isArray(data) ? data.slice(0, 15) : []);
        } catch (e) {
            console.error(e);
        } finally {
            setHistoryLoading(false);
        }
    };



    
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState(t('sys.str_522'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/pos/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
                const cats = [{id: t('pos.all'), name: t('sys.str_4068')}, ...data.categories];
                setCategories(cats);
            }
        } catch (e) {
            alert(t('sys.str_4069'));
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async (query: string = '') => {
        try {
            const res = await fetch(`/api/customers?search=${query}`);
            if (res.ok) setCustomers(await res.json());
        } catch (e) { console.error('Error fetching customers', e) }
    };

    useEffect(() => {
        if (showCustomerModal && customers.length === 0) fetchCustomers();
    }, [showCustomerModal]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['F2', 'F3', 'F4', 'F8'].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === 'F2') {
                document.getElementById('pay-cash-btn')?.click();
            } else if (e.key === 'F3') {
                document.getElementById('hold-btn')?.click();
            } else if (e.key === 'F4') {
                document.getElementById('held-orders-btn')?.click();
            } else if (e.key === 'F8') {
                const qtyInputs = document.querySelectorAll('.qty-input');
                if (qtyInputs.length > 0) {
                    (qtyInputs[qtyInputs.length - 1] as HTMLInputElement).select();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredProducts = products.filter(p => 
        (activeCategory === t('sys.str_522') || p.categoryId === activeCategory || p.categoryName === activeCategory) &&
        (p.name.includes(searchQuery) || p.barcode?.includes(searchQuery))
    );

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            alert(t('sys.str_4070'));
            return;
        }
        setCart(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = i.qty + delta;
                if (newQty <= 0) return null;
                return { ...i, qty: newQty };
            }
            return i;
        }).filter(Boolean));
    };

    // Coupons Logic
    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, cartTotal: total })
            });
            const data = await res.json();
            if (res.ok) {
                setAppliedCoupon(data);
                alert(`${t('pos.coupon_success')}  ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + t('sys.str_68')}`);
            } else {
                alert(data.error);
                setAppliedCoupon(null);
            }
        } catch {
            alert(t('sys.str_4071'));
        }
        setCouponLoading(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = total * (taxRate / 100); // Dynamic VAT
    
    // Calculate final with coupon
    let finalDiscountValue = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
            finalDiscountValue = total * (appliedCoupon.discountValue / 100);
        } else {
            finalDiscountValue = appliedCoupon.discountValue;
        }
    }
    const finalTotal = Math.max(0, total + tax - finalDiscountValue);

    const [isProcessing, setIsProcessing] = useState(false);



    const [showMadaModal, setShowMadaModal] = useState(false);
    const [madaStatus, setMadaStatus] = useState<'WAITING'|'APPROVED'|'REJECTED'>('WAITING');
    const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(null);

    const handleCheckout = async (paymentMethod: 'CASH' | 'CARD' | 'TABBY' | 'TAMARA' | 'TRANSFER' | 'SPLIT', isMadaCallback = false) => {
        if (cart.length === 0) return;
        
        // Mada Interceptor
        if ((paymentMethod === 'CARD' || (paymentMethod === 'SPLIT' && Number(splitCard) > 0)) && !isMadaCallback) {
            setActivePaymentMethod(paymentMethod);
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            setTimeout(() => {
                setMadaStatus('APPROVED');
                setTimeout(() => {
                    setShowMadaModal(false);
                    handleCheckout(paymentMethod, true); // Proceed with actual checkout using the callback flag
                }, 1500);
            }, 2500);
            return;
        }

        try {
            setIsProcessing(true);
            const body = {
                cart,
                total,
                tax,
                discount: finalDiscountValue,
                couponId: appliedCoupon ? appliedCoupon.id : null,
                paymentMethod,
                splitDetails: paymentMethod === 'SPLIT' ? { cash: Number(splitCash), card: Number(splitCard) } : null,
                customerId: selectedCustomer ? selectedCustomer.id : null,
                shiftId: null 
            };
            const res = await fetch('/api/pos/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setCompletedInvoiceId(data.invoice.id);
                setCart([]); 
                removeCoupon(); 
                setSelectedCustomer(null); 
                fetchProducts(); 
            } else {
                alert(data.error || t('sys.str_4075'));
            }
        } catch (e) {
            alert(t('sys.str_4076'));
        } finally {
            setIsProcessing(false);
        }
    };

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => { setIsMounted(true); }, []);

    return (
        <div className="pos-container" dir={isRTL ? 'rtl' : 'ltr'}>
            

            {!isMounted ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>{t("sys.str_168")}...</div>
            ) : (<>
            {/* Category Sidebar Pane */}
            <div className="categories-pane">
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Left/Right Pane based on RTL */}
            <div className="products-pane">
                <header className="pos-header">
                    <div className="nav-buttons">
                        <button type="button" className="btn-back" onClick={() => {
                            try {
                                const u = JSON.parse(localStorage.getItem('user') || '{}');
                                const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];
                                window.location.href = ADMIN_ROLES.includes(u.role) ? '/dashboard' : '/sales';
                            } catch { window.location.href = '/sales'; }
                        }}>
                            <ArrowRight size={20} style={{ transform: isRTL ? 'rotate(0)' : 'rotate(180deg)' }} />
                            {t('sys.str_4028')}</button>
                        <button type="button" onClick={() => setShowReturnsModal(true)} className="btn-back" style={{ color: '#ef4444', textDecoration: 'none', border: 'none', background: 'transparent' }}>
                              ↩ استرجاع محلي
                        </button>
                        <button className="btn-back" onClick={() => { if(confirm('هل أنت متأكد من مسح جميع المنتجات من السلة؟')) setCart([]); }}>
                            <Trash2 size={18} /> مسح السلة</button>
                        <button id="held-orders-btn" className="btn-back" onClick={() => setShowHeldOrdersModal(true)} style={{ background: heldOrders.length > 0 ? 'rgba(245, 158, 11, 0.2)' : '', color: heldOrders.length > 0 ? '#fcd34d' : '' }}>
                            <Clock size={18} /> {t('sys.str_4029')}{heldOrders.length}) <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '4px' }}>F4</kbd>
                        </button>
                        <button className="btn-back" onClick={fetchRecentOrders}>
                            <History size={18} /> {t('sys.str_4030')}</button>
                    </div>

                    <div className="search-bar">
                        <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRTL ? 'right' : 'left']: '12px', color: '#a3a3a3' }} />
                        <input 
                            type="text" 
                            placeholder={t('sys.str_4077')} 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <span style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>{t('sys.str_4031')}</span>
                    </div>
                </header>

                <div className="products-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a3a3a3' }}>
                            {t('sys.str_4032')}</div>
                    ) : (
                        filteredProducts.slice(0, 100).map((product: any) => (
                            <div key={product.id} className={`product-card ${product.stock <= 0 ? 'disabled' : ''}`} onClick={() => product.stock > 0 && addToCart(product)}>
                                {product.stock <= 0 && <span className="stock-badge">{t('sys.str_4033')}</span>}
                                <div className="product-icon" style={{ overflow: 'hidden' }}>
                                    {product.img && product.img.length > 2 && (product.img.startsWith('/') || product.img.startsWith('http'))
                                        ? <img src={product.img} alt={product.name} style={{width:'60px', height:'60px', objectFit:'contain', borderRadius:'8px'}} /> 
                                        : <div style={{width:'60px', height:'60px', background:'#2a2a2a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontSize:'0.9rem', fontWeight:'bold'}}>{product.name ? product.name.substring(0,2) : ''}</div>
                                    }
                                </div>
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">{product.price.toLocaleString()} {t('sys.str_68')}</div>
                            </div>
                        ))
                    )}
                    {!loading && filteredProducts.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a3a3a3' }}>
                            {t('sys.str_4034')}</div>
                    )}
                </div>
            </div>

            <div className="cart-pane">
                <div className="cart-header">
                    <h2>{t('sys.str_4035')}</h2>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        {cart.reduce((a, b) => a + b.qty, 0)} {t('sys.str_4036')}</span>
                </div>

                <div className="customer-selector">
                    <button className="customer-btn" onClick={() => setShowCustomerModal(true)} style={{ background: selectedCustomer ? 'rgba(34, 197, 94, 0.1)' : '', borderColor: selectedCustomer ? '#22c55e' : '', color: selectedCustomer ? '#22c55e' : '' }}>
                        <User size={18} />
                        {selectedCustomer ? `${t('pos.linked_customer')}${selectedCustomer.name}` : t('pos.str_183')}
                    </button>
                    {selectedCustomer && (
                        <button onClick={() => setSelectedCustomer(null)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
                            {t('sys.str_4037')}</button>
                    )}
                </div>

                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">{item.price} {t('sys.str_68')}</span>
                            </div>
                            <div className="item-controls">
                                <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                                <input 
                                    type="number" 
                                    className="qty-input"
                                    min="1"
                                    style={{ width: '40px', textAlign: 'center', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '4px', fontSize: '1rem', padding: '2px 0' }}
                                    value={item.qty}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val > 0) {
                                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: val } : i));
                                        } else if (e.target.value === '') {
                                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: '' as any } : i));
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!item.qty || item.qty <= 0) {
                                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: 1 } : i));
                                        }
                                    }}
                                />
                                <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                            </div>
                        </div>
                    ))}
                    
                    {cart.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', gap: '1rem' }}>
                            <ShoppingCart size={48} />
                            <p>{t('sys.str_4038')}</p>
                        </div>
                    )}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>{t('sys.str_768')}</span>
                        <span>{total.toLocaleString()} {t('sys.str_68')}</span>
                    </div>
                    {appliedCoupon && (
                        <div className="summary-row" style={{ color: '#10b981', fontWeight: 'bold' }}>
                            <span>{t('sys.str_4039')}{appliedCoupon.code})</span>
                            <span>- {finalDiscountValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} {t('sys.str_68')}</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>{t('sys.str_4040')}</span>
                        <span>{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {t('sys.str_68')}</span>
                    </div>
                    
                    {/* Coupon Input Box */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <input 
                            type="text" 
                            placeholder={t('sys.str_4078')} 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
                        />
                        {!appliedCoupon ? (
                            <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                {couponLoading ? '...' : t('pos.str_184')}
                            </button>
                        ) : (
                            <button onClick={removeCoupon} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                {t('fin.str_206')}</button>
                        )}
                    </div>

                    <div className="summary-total">
                        <span>{t('sys.str_66')}</span>
                        <span>{finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {t('sys.str_68')}</span>
                    </div>
                </div>

                <div className="checkout-actions">
                    <button id="pay-cash-btn" className="pay-btn pay-cash" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CASH')}>
                        <Banknote size={20} /> {isProcessing ? t('pos.str_185') : t('pos.str_186')} <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '4px' }}>F2</kbd>
                    </button>
                    <button className="pay-btn pay-card" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CARD')}>
                        <CreditCard size={20} /> {isProcessing ? t('pos.str_185') : t('pos.str_187')}
                    </button>
                    <button className="pay-btn" style={{ background: 'var(--primary-color)', color: 'white' }} disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('TRANSFER')}>
                        🏦 {'تحويل بنكي'}
                    </button>
                    <button className="pay-btn" style={{ background: '#f59e0b', color: 'white' }} disabled={cart.length === 0 || isProcessing} onClick={() => setShowSplitModal(true)}>
                        ✂️ {'تقسيم الفاتورة'}
                    </button>

                    <button id="hold-btn" className="pay-btn" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.1)', color: 'white' }} disabled={cart.length === 0 || isProcessing} onClick={handleHoldOrder}>
                        <Save size={20} /> {t('sys.str_4041')} <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '4px' }}>F3</kbd></button>
                </div>
            </div>

            {/* Split Payment Modal */}
            {showSplitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSplitModal(false)}>
                    <div style={{ background: '#111', width: '400px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>{'تقسيم المدفوعات'}</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: '#fbbf24' }}>
                            {t('sys.str_66')}: {finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_68')}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>{'المبلغ النقدي'} (Cash)</label>
                            <input 
                                type="number" 
                                className="search-bar" 
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }} 
                                value={splitCash} 
                                onChange={e => {
                                    const cashVal = Number(e.target.value);
                                    setSplitCash(e.target.value);
                                    if (cashVal < finalTotal) {
                                        setSplitCard((finalTotal - cashVal).toFixed(2));
                                    } else {
                                        setSplitCard('0');
                                    }
                                }} 
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>{'مبلغ الشبكة'} (Card)</label>
                            <input type="number" disabled className="search-bar" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#333', color: '#aaa', opacity: 0.7 }} value={splitCard} />
                        </div>
                        {((Number(splitCash) || 0) + (Number(splitCard) || 0)) < finalTotal && (
                            <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{t('pos.str_195')}</div>
                        )}
                        {((Number(splitCash) || 0) + (Number(splitCard) || 0)) > finalTotal && (
                            <div style={{ color: '#22c55e', marginBottom: '1rem', textAlign: 'center' }}>{t('pos.str_196')} {(((Number(splitCash)||0) + (Number(splitCard)||0)) - finalTotal).toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_68')}</div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="pay-cash" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#333', color: 'white', cursor: 'pointer' }} onClick={() => setShowSplitModal(false)}>{t('fin.str_206')}</button>
                            <button className="pay-card" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', opacity: (((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01)) ? 0.5 : 1 }} disabled={((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01) || isProcessing} onClick={() => { setShowSplitModal(false); handleCheckout('SPLIT'); }}>
                                {isProcessing ? t('pos.str_185') : t('pos.str_186')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Selection Modal */}
            {showCustomerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCustomerModal(false)}>
                    <div style={{ background: '#111', width: '500px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('sys.str_4042')}</h3>
                            <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <input 
                            type="text" 
                            placeholder={t('sys.str_4079')} 
                            value={customerSearch}
                            onChange={e => {
                                setCustomerSearch(e.target.value);
                                fetchCustomers(e.target.value);
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', marginBottom: '1rem', outline: 'none' }}
                        />
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {customers.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                                    style={{ padding: '0.75rem', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                                    <span style={{ color: '#aaa', fontSize: '0.9rem', direction: 'ltr' }}>{c.phone || '-'}</span>
                                </div>
                            ))}
                            {customers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>{t('sys.str_4043')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {/* Held Orders Modal */}
            {showHeldOrdersModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHeldOrdersModal(false)}>
                    <div style={{ background: '#111', width: '600px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('sys.str_4048')}</h3>
                            <button onClick={() => setShowHeldOrdersModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {heldOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>{t('sys.str_4049')}</p> : 
                            heldOrders.map((order: any) => (
                                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{t('sys.str_4050')}{order.time}</div>
                                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{t('sys.str_57')}{order.customer?.name || t('sys.str_4081')} {t('sys.str_4051')}{order.cart?.length}</div>
                                        <div style={{ color: '#818cf8', fontWeight: 'bold', marginTop: '0.5rem' }}>{t('sys.str_4052')}{order.total?.toLocaleString()} {t('sys.str_68')}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleRestoreOrder(order)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t('sys.str_4053')}</button>
                                        <button onClick={() => saveHeldOrders(heldOrders.filter(o => o.id !== order.id))} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Orders Modal */}
            {showHistoryModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHistoryModal(false)}>
                    <div style={{ background: '#111', width: '700px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('sys.str_4054')}</h3>
                            <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {historyLoading ? <p style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>{t('sys.str_168')}</p> : 
                            recentOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>{t('sys.str_4055')}</p> : 
                            recentOrders.map((inv: any) => (
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{t('sys.str_4056')}{inv.invoiceNo}</div>
                                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{new Date(inv.date).toLocaleString('ar-SA')} {t('sys.str_4057')}{inv.customer?.name || t('sys.str_4081')}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '1.2rem' }}>{inv.total?.toLocaleString()} {t('sys.str_68')}</div>
                                        <button onClick={() => { setCompletedInvoiceId(inv.id); setShowHistoryModal(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #555', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>{t('sys.str_4058')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mada Terminal Integration Simulator */}
            {showMadaModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ background: '#fff', width: '400px', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        
                        {/* Mada Logo Placeholder */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
                            <div style={{ width: '20px', height: '40px', background: '#3b82f6', borderRadius: '10px' }}></div>
                            <div style={{ width: '20px', height: '40px', background: '#10b981', borderRadius: '10px' }}></div>
                            <div style={{ width: '20px', height: '40px', background: '#f59e0b', borderRadius: '10px' }}></div>
                        </div>

                        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem' }}>{t('sys.str_4059')}</h2>
                        
                        <div style={{ background: '#f1f5f9', width: '100%', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{t('sys.str_4060')}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{finalTotal.toLocaleString()} SAR</span>
                        </div>

                        {madaStatus === 'WAITING' && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => setShowMadaModal(false)}
                                style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                            >
                                {t('sys.str_4046')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowMadaModal(false);
                                    handleCheckout(activePaymentMethod === 'SPLIT' ? 'SPLIT' : 'CARD', true);
                                }}
                                style={{ background: '#ecfdf5', border: '1px solid #d1fae5', padding: '8px 16px', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                            >
                                الدفع يدوياً
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Auto Print ZATCA Receipt */}
            {completedInvoiceId && (
                <InvoiceReceipt 
                    invoiceId={completedInvoiceId} 
                    autoPrint={true} 
                    onClose={() => setCompletedInvoiceId(null)} 
                />
            )}
            <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />
            </>
            )}
        </div>
    );
}
