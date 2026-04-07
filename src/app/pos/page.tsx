'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Grid, Trash2, Clock, History, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import InvoiceReceipt from '@/components/InvoiceReceipt';

export default function POSPage() {
    const { t, lang } = useTranslation();
    const isRTL = lang === 'ar';

    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<any[]>([]);
    
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

    // Hold & History State
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

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

    // BNPL State
    const [showBnplModal, setShowBnplModal] = useState(false);
    const [bnplProvider, setBnplProvider] = useState<'tabby'|'tamara'>('tabby');
    const [bnplPhone, setBnplPhone] = useState('');
    const [bnplUrl, setBnplUrl] = useState('');
    const [bnplOrderId, setBnplOrderId] = useState('');
    const [bnplLoading, setBnplLoading] = useState(false);
    const [bnplStatusMessage, setBnplStatusMessage] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showBnplModal && bnplOrderId && bnplUrl) {
            setBnplStatusMessage(t('sys.str_4065'));
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/pos/bnpl/status?provider=${bnplProvider}&sessionId=${bnplOrderId}`);
                    const data = await res.json();
                    if (data.isSuccess) {
                        setBnplStatusMessage(t('sys.str_4066'));
                        clearInterval(interval);
                        handleCheckout(bnplProvider.toUpperCase() as any);
                    } else if (data.status === 'REJECTED' || data.status === 'DECLINED') {
                        setBnplStatusMessage(t('sys.str_4067') + bnplProvider);
                        clearInterval(interval);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showBnplModal, bnplOrderId, bnplProvider, bnplUrl]);

    
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
                const cats = [{id: 'الكل', name: t('sys.str_4068')}, ...data.categories];
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
                alert(`تم تطبيق الكوبون بنجاح بخصم ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + t('sys.str_68')}`);
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
    const tax = total * 0.15; // 15% VAT placeholder
    
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

    const startBnplCheckout = (provider: 'tabby'|'tamara') => {
        setBnplProvider(provider);
        setBnplPhone(selectedCustomer?.phone || '');
        setBnplUrl('');
        setBnplOrderId('');
        setShowBnplModal(true);
    };

    const handleCreateBnplSession = async () => {
        if (!bnplPhone) return alert(t('sys.str_4072'));
        if (cart.length === 0) return;
        setBnplLoading(true);
        try {
            const res = await fetch(`/api/bnpl/${bnplProvider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalAmount: finalTotal,
                    phone: bnplPhone,
                    customerName: selectedCustomer?.name || t('sys.str_4073'),
                    orderId: `POS-${Date.now()}`,
                    items: cart
                })
            });
            const data = await res.json();
            if (data.success) {
                setBnplUrl(data.checkoutUrl);
                setBnplOrderId(data.paymentId || data.orderId);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert(t('sys.str_4074') + bnplProvider);
        } finally {
            setBnplLoading(false);
        }
    };

    const [showMadaModal, setShowMadaModal] = useState(false);
    const [madaStatus, setMadaStatus] = useState<'WAITING'|'APPROVED'|'REJECTED'>('WAITING');

    const handleCheckout = async (paymentMethod: 'CASH' | 'CARD' | 'TABBY' | 'TAMARA') => {
        if (cart.length === 0) return;
        
        // Mada Interceptor
        if (paymentMethod === 'CARD' && !showMadaModal) {
            setShowMadaModal(true);
            setMadaStatus('WAITING');
            setTimeout(() => {
                setMadaStatus('APPROVED');
                setTimeout(() => {
                    setShowMadaModal(false);
                    handleCheckout('CARD'); // Proceed with actual checkout
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
                bnplOrderId: (paymentMethod === 'TABBY' || paymentMethod === 'TAMARA') ? bnplOrderId : null,
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
                setShowBnplModal(false);
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

    return (
        <div className="pos-container" dir={isRTL ? 'rtl' : 'ltr'}>
            <style jsx>{`
                .pos-container {
                    display: flex;
                    height: 100vh;
                    background: var(--bg-primary, #0a0a0a);
                    color: var(--text-primary, #ffffff);
                    font-family: 'Inter', system-ui, sans-serif;
                    overflow: hidden;
                }
                .products-pane {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    border-${isRTL ? 'left' : 'right'}: 1px solid var(--border-color, #2a2a2a);
                }
                .pos-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    background: var(--card-bg, #111111);
                    border-bottom: 1px solid var(--border-color, #2a2a2a);
                }
                .search-bar {
                    flex: 0.5;
                    position: relative;
                }
                .search-bar input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border-radius: 9999px;
                    border: 1px solid var(--border-color, #333);
                    background: var(--bg-secondary, #1a1a1a);
                    color: white;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .search-bar input:focus {
                    border-color: var(--primary-color, #6366f1);
                }
                .nav-buttons {
                    display: flex;
                    gap: 1rem;
                }
                .btn-back {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background 0.2s;
                }
                .btn-back:hover { background: rgba(255, 255, 255, 0.1); }
                
                .categories-pane {
                    width: 140px;
                    background: var(--card-bg, #111);
                    border-${isRTL ? 'left' : 'right'}: 1px solid var(--border-color, #2a2a2a);
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #333 transparent;
                }
                .categories-pane::-webkit-scrollbar {
                    width: 4px;
                }
                .categories-pane::-webkit-scrollbar-thumb {
                    background-color: #333;
                    border-radius: 4px;
                }
                .categories-pane::-webkit-scrollbar-track {
                    background: transparent;
                }
                .category-btn {
                    padding: 1rem 0.5rem;
                    text-align: center;
                    border: none;
                    background: transparent;
                    border-bottom: 1px solid var(--border-color, #2a2a2a);
                    color: var(--text-muted, #a3a3a3);
                    cursor: pointer;
                    white-space: normal;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                .category-btn:hover {
                    background: #1f2937;
                    color: white;
                }
                .category-btn.active {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border-${isRTL ? 'right' : 'left'}: 4px solid #22c55e;
                }
                
                .products-grid {
                    padding: 1.5rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 1rem;
                    overflow-y: auto;
                    align-content: start;
                }
                .product-card {
                    background: var(--card-bg, #111);
                    border: 1px solid var(--border-color, #2a2a2a);
                    border-radius: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: transform 0.2s, border-color 0.2s;
                    position: relative;
                }
                .product-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--primary-color, #6366f1);
                }
                .product-card.out-of-stock {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .product-icon {
                    width: 100%;
                    aspect-ratio: 1;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .product-name {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                .product-price {
                    color: var(--primary-color, #818cf8);
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .stock-badge {
                    position: absolute;
                    top: 10px;
                    ${isRTL ? 'left' : 'right'}: 10px;
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(255,255,255,0.1);
                }

                .cart-pane {
                    width: 400px;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-secondary, #111);
                }
                .cart-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color, #2a2a2a);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .cart-header h2 { margin: 0; font-size: 1.25rem; }
                
                .customer-selector {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border-color, #2a2a2a);
                }
                .customer-btn {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 8px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px dashed var(--primary-color, #6366f1);
                    color: var(--primary-color, #818cf8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .cart-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .cart-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    background: var(--card-bg, #1a1a1a);
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #2a2a2a);
                }
                .item-info { flex: 1; }
                .item-name { font-weight: 600; margin-bottom: 0.25rem; display: block; }
                .item-price { color: var(--text-muted, #a3a3a3); font-size: 0.9rem; }
                .item-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .qty-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    border: none;
                    background: rgba(255,255,255,0.1);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .qty-btn:hover { background: rgba(255,255,255,0.2); }
                
                .cart-summary {
                    padding: 1.5rem;
                    background: var(--card-bg, #0a0a0a);
                    border-top: 1px solid var(--border-color, #2a2a2a);
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    color: var(--text-muted, #a3a3a3);
                }
                .summary-total {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px dashed var(--border-color, #2a2a2a);
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }

                .checkout-actions {
                    padding: 0 1.5rem 1.5rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    background: var(--card-bg, #0a0a0a);
                }
                .pay-btn {
                    padding: 1rem;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: transform 0.1s;
                }
                .pay-btn:active { transform: scale(0.98); }
                .pay-cash {
                    background: #22c55e;
                    color: white;
                }
                .pay-card {
                    background: var(--primary-color, #6366f1);
                    color: white;
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>

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
                        <Link href="/dashboard" className="btn-back">
                            <ArrowRight size={20} style={{ transform: isRTL ? 'rotate(0)' : 'rotate(180deg)' }} />
                            {t('sys.str_4028')}</Link>
                        <button className="btn-back" onClick={() => setShowHeldOrdersModal(true)} style={{ background: heldOrders.length > 0 ? 'rgba(245, 158, 11, 0.2)' : '', color: heldOrders.length > 0 ? '#fcd34d' : '' }}>
                            <Clock size={18} /> {t('sys.str_4029')}{heldOrders.length})
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
                        {selectedCustomer ? `العميل المربوط: ${selectedCustomer.name}` : t('pos.str_183')}
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
                                <span>{item.qty}</span>
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
                    <button className="pay-btn pay-cash" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CASH')}>
                        <Banknote size={20} /> {isProcessing ? t('pos.str_185') : t('pos.str_186')}
                    </button>
                    <button className="pay-btn pay-card" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CARD')}>
                        <CreditCard size={20} /> {isProcessing ? t('pos.str_185') : t('pos.str_187')}
                    </button>
                    <button className="pay-btn" style={{ background: '#3eedbf', color: '#111' }} disabled={cart.length === 0 || isProcessing} onClick={() => startBnplCheckout('tabby')}>
                        <strong>{t('pos.str_188')}</strong> Tabby
                    </button>
                    <button className="pay-btn" style={{ background: '#ffb5a3', color: '#111' }} disabled={cart.length === 0 || isProcessing} onClick={() => startBnplCheckout('tamara')}>
                        <strong>{t('pos.str_189')}</strong> Tamara
                    </button>
                    <button className="pay-btn" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.1)', color: 'white' }} disabled={cart.length === 0 || isProcessing} onClick={handleHoldOrder}>
                        <Save size={20} /> {t('sys.str_4041')}</button>
                </div>
            </div>

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

            {/* BNPL QR Scanner Modal */}
            {showBnplModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBnplModal(false)}>
                    <div style={{ background: '#111', width: '450px', borderRadius: '16px', padding: '2rem', border: '1px solid #333', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: bnplProvider === 'tabby' ? '#3eedbf' : '#ffb5a3', marginBottom: '1rem' }}>
                            {t('sys.str_4044')}{bnplProvider === 'tabby' ? t('pos.str_188') : t('pos.str_189')}
                        </h2>
                        
                        {!bnplUrl ? (
                            <>
                                <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>{t('sys.str_4045')}<strong>{finalTotal.toLocaleString()} {t('sys.str_68')}</strong></p>
                                <input 
                                    type="text" 
                                    placeholder={t('sys.str_4080')} 
                                    value={bnplPhone}
                                    onChange={e => setBnplPhone(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                                />
                                <button 
                                    onClick={handleCreateBnplSession} 
                                    disabled={bnplLoading || !bnplPhone}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: bnplProvider === 'tabby' ? '#3eedbf' : '#ffb5a3', color: '#111', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                                >
                                    {bnplLoading ? t('pos.str_190') : t('pos.str_191')}
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <QRCodeCanvas value={bnplUrl} size={250} level="H" includeMargin />
                                </div>
                                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', width: '100%' }}>
                                    <p style={{ color: '#fff', fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {bnplStatusMessage.includes('✅') || bnplStatusMessage.includes('❌') ? null : <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}>⏳</span>}
                                        {bnplStatusMessage}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                    <button 
                                        onClick={() => setShowBnplModal(false)}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #555', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                                    >
                                        {t('sys.str_4046')}</button>
                                    <button 
                                        onClick={() => handleCheckout(bnplProvider.toUpperCase() as any)}
                                        disabled={isProcessing}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {t('sys.str_4047')}</button>
                                </div>
                            </div>
                        )}
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <div className="spinner" style={{ width: '48px', height: '48px', borderTopColor: '#3b82f6', borderWidth: '4px' }}></div>
                                <p style={{ color: '#64748b', margin: 0, fontWeight: 600 }}>{t('sys.str_4061')}</p>
                            </div>
                        )}

                        {madaStatus === 'APPROVED' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem', animation: 'fadeIn 0.3s ease-in-out' }}>
                                <div style={{ width: '64px', height: '64px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <p style={{ color: '#10b981', margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{t('sys.str_4062')}</p>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{t('sys.str_4063')}</p>
                            </div>
                        )}
                        
                        {madaStatus === 'WAITING' && (
                            <button onClick={() => setShowMadaModal(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', marginTop: '1rem', cursor: 'pointer', fontWeight: 600 }}>{t('sys.str_4046')}</button>
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
        </div>
    );
}
