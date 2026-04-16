'use client';

import React, { useState, useEffect } from 'react';
import PosReturnsModal from '@/components/PosReturnsModal';
import { useMadaTerminal } from '@/hooks/useMadaTerminal';
import Link from 'next/link';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2 } from 'lucide-react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";

export default function RestaurantPOS() {
    const { t } = useTranslation();
    // Force RTL for this specific layout to match image perfectly
    const isRTL = true;

    const [searchQuery, setSearchQuery] = useState('');
    const [taxRate, setTaxRate] = useState(15);
    const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();
    const [cart, setCart] = useState<any[]>([]);
    const [showReturnsModal, setShowReturnsModal] = useState(false);
    const [completedInvoiceId, setCompletedInvoiceId] = useState<number | null>(null);

    
    // Coupons Engine State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Customer Selector State
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');

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
        const saved = localStorage.getItem('rest_held_orders');
        if (saved) {
            try { setHeldOrders(JSON.parse(saved)); } catch (e) {}
        }
    }, []);

    const saveHeldOrders = (orders: any[]) => {
        setHeldOrders(orders);
        localStorage.setItem('rest_held_orders', JSON.stringify(orders));
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
        alert(t('sys.str_4112'));
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
    const [activeCategory, setActiveCategory] = useState(t('sys.str_4068'));
    const [loading, setLoading] = useState(true);
    const [numpadValue, setNumpadValue] = useState('');

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
        (activeCategory === t('sys.str_4068') || p.categoryId === activeCategory || p.categoryName === activeCategory) &&
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
                    handleCheckout(paymentMethod, true); // Proceed with actual checkout
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
                
                setCart([]); // clear cart
                removeCoupon(); // clear active coupon
                setSelectedCustomer(null); // clear linked customer
                setNumpadValue('');
                fetchProducts(); // refresh stock
            } else {
                alert(data.error || t('sys.str_4075'));
            }
        } catch (e) {
            alert(t('sys.str_4076'));
        } finally {
            setIsProcessing(false);
        }
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
                alert(`${t('pos.coupon_success')}  ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + t('sys.str_4105')}`);
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
    const tax = total * 0.15; // 15% VAT
    
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

    const handleNumpad = (val: string) => {
        if (val === 'C') {
            setNumpadValue('');
        } else {
            setNumpadValue(prev => prev + val);
        }
    };

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => { setIsMounted(true); }, []);

    return (
        <div className="restaurant-pos" dir="rtl">
            

            {!isMounted ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>{t("sys.str_168")}...</div>
            ) : (<>
            {/* LEFT CATEGORIES */}
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

            {/* CENTER PRODUCTS */}
            <div className="main-pane">
                <div className="top-bar">
                    <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                        <Link href="/dashboard" style={{textDecoration:'none', color:'#666', display:'flex', alignItems:'center', gap:'0.25rem'}}>
                            <ArrowRight size={18} /> {t('sys.str_4082')}</Link>
                        <h2 style={{margin:0, fontSize:'1.2rem', color:'#333', marginLeft: '1rem'}}>{t('sys.str_4083')}</h2>
                        
                        <button type="button" onClick={() => setShowReturnsModal(true)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                              ↩ استرجاع محلي
                          </button>
                        <button onClick={() => { if(confirm('هل أنت متأكد من مسح جميع المنتجات من السلة؟')) setCart([]); }} style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                            <Trash2 size={16} /> مسح السلة
                        </button>
                        <button onClick={() => setShowHeldOrdersModal(true)} style={{ background: heldOrders.length > 0 ? '#fef3c7' : 'transparent', color: heldOrders.length > 0 ? '#d97706' : '#64748b', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                            <Clock size={16} /> {t('sys.str_4084')}{heldOrders.length})
                        </button>
                        <button onClick={fetchRecentOrders} style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                            <History size={16} /> {t('sys.str_4085')}</button>
                    </div>
                    <input 
                        className="search-input"
                        type="text" 
                        placeholder={t('sys.str_4114')} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="products-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                            {t('sys.str_4086')}</div>
                    ) : filteredProducts.slice(0, 100).map((product: any) => (
                        <div 
                            key={product.id} 
                            className="product-card"
                            onClick={() => addToCart(product)}
                            style={{ opacity: product.stock <= 0 ? 0.6 : 1 }}
                        >
                            <div className="product-img-wrapper" style={{ overflow: 'hidden' }}>
                                {product.img && product.img.length > 2 && (product.img.startsWith('/') || product.img.startsWith('http'))
                                    ? <img src={product.img} alt={product.name} style={{width:'60px', height:'60px', objectFit:'contain', borderRadius: '8px'}} /> 
                                    : <div style={{width:'60px', height:'60px', background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.8rem', fontWeight:'bold'}}>{product.name ? product.name.substring(0,2) : ''}</div>}
                            </div>
                            <div className="product-name">{product.name}</div>
                            <div className="product-price">SR {product.price.toLocaleString()}</div>
                        </div>
                    ))}
                    {!loading && filteredProducts.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                            {t('sys.str_4087')}</div>
                    )}
                </div>
            </div>

            {/* RIGHT CART & NUMPAD */}
            <div className="cart-pane">
                <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                        onClick={() => setShowCustomerModal(true)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: selectedCustomer ? '1px solid #22c55e' : '1px dashed #cbd5e1', background: selectedCustomer ? 'rgba(34,197,94,0.1)' : '#f8f9fa', color: selectedCustomer ? '#22c55e' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <User size={18} />
                        {selectedCustomer ? `${t('resto.customer_linked')}${selectedCustomer.name}` : t('sys.str_4115')}
                    </button>
                    {selectedCustomer && (
                        <button onClick={() => setSelectedCustomer(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}>
                            {t('sys.str_4037')}</button>
                    )}
                </div>
                
                <div className="cart-totals-banner">
                    <div className="banner-row">
                        <span>{t('sys.str_4088')}</span>
                        <span>{total.toLocaleString()}</span>
                    </div>
                    {/* Discount Row */}
                    {appliedCoupon ? (
                        <div className="banner-row" style={{ color: '#fff', background: 'rgba(34, 197, 94, 0.2)', padding: '2px 4px', borderRadius: '4px' }}>
                            <span>{t('sys.str_4039')}{appliedCoupon.code}):</span>
                            <span>- {finalDiscountValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                    ) : (
                        <div className="banner-row">
                            <span>{t('sys.str_4089')}</span>
                            <span>0</span>
                        </div>
                    )}
                    <div className="banner-row">
                        <span>{t('sys.str_4090')}</span>
                        <span>{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="banner-grand">
                        <span>{t('sys.str_4091')}</span>
                        <span>{finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                </div>

                <div className="cart-table">
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead>
                            <tr>
                                <th>{t('sys.str_4092')}</th>
                                <th style={{textAlign:'center'}}>{t('sys.str_4093')}</th>
                                <th style={{textAlign:'center'}}>{t('sys.str_4094')}</th>
                                <th>{t('sys.str_4095')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.id} className="cart-row" style={{display:'table-row'}}>
                                    <td style={{padding:'0.75rem 0.5rem', borderBottom:'1px solid #eee', fontWeight:600}}>{item.name}</td>
                                    <td style={{padding:'0.75rem 0.5rem', borderBottom:'1px solid #eee', textAlign:'center'}}>
                                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
                                            <button className="qty-circle" onClick={() => updateQty(item.id, -1)}>-</button>
                                            <input 
                                                type="number" 
                                                className="qty-input"
                                                min="1"
                                                style={{ width: '40px', textAlign: 'center', background: 'transparent', border: '1px solid #ddd', color: '#333', borderRadius: '4px', fontSize: '1rem', padding: '2px 0' }}
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
                                            <button className="qty-circle" onClick={() => updateQty(item.id, 1)}>+</button>
                                        </div>
                                    </td>
                                    <td style={{padding:'0.75rem 0.5rem', borderBottom:'1px solid #eee', textAlign:'center', color:'#666'}}>{item.price}</td>
                                    <td style={{padding:'0.75rem 0.5rem', borderBottom:'1px solid #eee', color:'#16a34a', fontWeight:700}}>{(item.price * item.qty).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {cart.length === 0 && (
                        <div style={{textAlign:'center', padding:'3rem', color:'#aaa'}}>
                            {t('sys.str_4096')}</div>
                    )}
                </div>

                {/* Coupon Input Box Container */}
                <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #ddd', display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        placeholder={t('sys.str_4078')} 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    {!appliedCoupon ? (
                        <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {couponLoading ? '...' : t('sys.str_4116')}
                        </button>
                    ) : (
                        <button onClick={removeCoupon} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {t('sys.str_4097')}</button>
                    )}
                </div>

                <div className="numpad-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button id="hold-btn" onClick={handleHoldOrder} disabled={cart.length === 0} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                            <Clock size={18} /> {t('sys.str_4098')} <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '4px' }}>F3</kbd></button>
                        <button id="pay-cash-btn" className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CASH')} style={{ background: '#22c55e', fontSize: '1.2rem', padding: '0.5rem', height: '60px' }}>
                            <span style={{ fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>CASH <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '4px', marginTop: '2px' }}>F2</kbd></span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CARD')} style={{ background: '#3b82f6', fontSize: '1.2rem', padding: '0.5rem', height: '60px' }}>
                            <span style={{ fontSize: '1.2rem' }}>MADA</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('TRANSFER' as any)} style={{ background: '#8b5cf6', fontSize: '1.2rem', padding: '0.5rem', height: '60px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{'تحويل بنكي'}</span>
                        </button>
                        <button className="pay-btn-big" disabled={cart.length === 0 || isProcessing} onClick={() => setShowSplitModal(true)} style={{ background: '#f59e0b', fontSize: '1.2rem', padding: '0.5rem', height: '60px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{'تقسيم الفاتورة'}</span>
                        </button>
                    </div>

                    <div className="numpad-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {['7','8','9','4','5','6','1','2','3','0','C','.'].map(key => (
                            <button 
                                key={key} 
                                className="numpad-btn"
                                onClick={() => handleNumpad(key)}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Optional Status / Input Bar */}
                <div style={{ background: '#334155', color: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', fontSize:'0.85rem' }}>
                    <span>{numpadValue ? `${t('resto.input')}${numpadValue}` : t('sys.str_4117')}</span>
                    <span>{t('sys.str_4101')}</span>
                </div>
            </div>

            {/* Split Payment Modal */}
            {showSplitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSplitModal(false)}>
                    <div style={{ background: '#fff', width: '400px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #ddd', color: '#333', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>{'تقسيم المدفوعات'}</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: '#f59e0b' }}>
                            {t('sys.str_66')}: {finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_4105')}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>{'المبلغ النقدي'} (Cash)</label>
                            <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={splitCash} onChange={e => { const cashVal = Number(e.target.value); setSplitCash(e.target.value); if (cashVal < finalTotal) { setSplitCard((finalTotal - cashVal).toFixed(2)); } else { setSplitCard('0'); } }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>{'مبلغ الشبكة'} (Card)</label>
                            <input type="number" disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#e2e8f0', color: '#64748b' }} value={splitCard} />
                        </div>
                        {((Number(splitCash) || 0) + (Number(splitCard) || 0)) < finalTotal && (
                            <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{t('pos.str_195')}</div>
                        )}
                        {((Number(splitCash) || 0) + (Number(splitCard) || 0)) > finalTotal && (
                            <div style={{ color: '#22c55e', marginBottom: '1rem', textAlign: 'center' }}>{t('pos.str_196')} {(((Number(splitCash)||0) + (Number(splitCard)||0)) - finalTotal).toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_4105')}</div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#f8f9fa', color: '#333', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowSplitModal(false)}>{t('fin.str_206')}</button>
                            <button style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 'bold', opacity: (((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01)) ? 0.5 : 1 }} disabled={((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01) || isProcessing} onClick={() => { setShowSplitModal(false); handleCheckout('SPLIT'); }}>
                                {isProcessing ? t('sys.str_4070') : t('sys.str_4099')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Selection Modal */}
            {showCustomerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCustomerModal(false)}>
                    <div style={{ background: '#fff', width: '450px', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#333' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{t('sys.str_4042')}</h3>
                            <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <input 
                            type="text" 
                            placeholder={t('sys.str_4079')} 
                            value={customerSearch}
                            onChange={e => {
                                setCustomerSearch(e.target.value);
                                fetchCustomers(e.target.value);
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8f9fa', color: '#333', marginBottom: '1rem', outline: 'none' }}
                        />
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {customers.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                                    style={{ padding: '0.75rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: 'background 0.2s' }}
                                >
                                    <span style={{ fontWeight: '600', color: '#334155' }}>{c.name}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem', direction: 'ltr' }}>{c.phone || '-'}</span>
                                </div>
                            ))}
                            {customers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{t('sys.str_4043')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Held Orders Modal */}
            {showHeldOrdersModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHeldOrdersModal(false)}>
                    <div style={{ background: '#fff', width: '600px', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#333', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{t('sys.str_4102')}</h3>
                            <button onClick={() => setShowHeldOrdersModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {heldOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>{t('sys.str_4103')}</p> : 
                            heldOrders.map((order: any) => (
                                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', color: '#1e293b' }}>{t('sys.str_4050')}{order.time}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('sys.str_4104')}{order.customer?.name || t('sys.str_4081')} {t('sys.str_4051')}{order.cart?.length}</div>
                                        <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: '0.5rem' }}>{t('sys.str_4052')}{order.total?.toLocaleString()} {t('sys.str_4105')}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleRestoreOrder(order)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t('sys.str_4106')}</button>
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHistoryModal(false)}>
                    <div style={{ background: '#fff', width: '700px', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#333', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{t('sys.str_4054')}</h3>
                            <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {historyLoading ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>{t('sys.str_4107')}</p> : 
                            recentOrders.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>{t('sys.str_4055')}</p> : 
                            recentOrders.map((inv: any) => (
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', color: '#1e293b' }}>{t('sys.str_4056')}{inv.invoiceNo}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(inv.date).toLocaleString('ar-SA')} {t('sys.str_4057')}{inv.customer?.name || t('sys.str_4081')}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>{inv.total?.toLocaleString()} {t('sys.str_4105')}</div>
                                        <button onClick={() => { setCompletedInvoiceId(inv.id); setShowHistoryModal(false); }} style={{ background: '#22c55e', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>طباعة / عرض الفاتورة</button>
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
            <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />
            
            {/* Unified POS Invoice Receipt Modal */}
            {completedInvoiceId && (
                <InvoiceReceipt 
                    invoiceId={completedInvoiceId} 
                    autoPrint={true} 
                    onClose={() => setCompletedInvoiceId(null)} 
                />
            )}
            </>
            )}
        </div>
    );
}
