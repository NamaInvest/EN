'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Grid, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

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

    // BNPL State
    const [showBnplModal, setShowBnplModal] = useState(false);
    const [bnplProvider, setBnplProvider] = useState<'tabby'|'tamara'>('tabby');
    const [bnplPhone, setBnplPhone] = useState('');
    const [bnplUrl, setBnplUrl] = useState('');
    const [bnplOrderId, setBnplOrderId] = useState('');
    const [bnplLoading, setBnplLoading] = useState(false);

    
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('الكل');
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
                const cats = [{id: 'الكل', name: 'الكل'}, ...data.categories];
                setCategories(cats);
            }
        } catch (e) {
            alert('فشل جلب المنتجات');
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
        (activeCategory === 'الكل' || p.categoryId === activeCategory || p.categoryName === activeCategory) &&
        (p.name.includes(searchQuery) || p.barcode?.includes(searchQuery))
    );

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            alert('المنتج غير متوفر في المخزون');
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
                alert(`تم تطبيق الكوبون بنجاح بخصم ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + ' ر.س'}`);
            } else {
                alert(data.error);
                setAppliedCoupon(null);
            }
        } catch {
            alert('حدث خطأ أثناء فحص الكوبون');
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
        if (!bnplPhone) return alert('الرجاء إدخال رقم الجوال');
        if (cart.length === 0) return;
        setBnplLoading(true);
        try {
            const res = await fetch(`/api/bnpl/${bnplProvider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalAmount: finalTotal,
                    phone: bnplPhone,
                    customerName: selectedCustomer?.name || 'عميل مباشر',
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
            alert('حدث خطأ في الاتصال بـ ' + bnplProvider);
        } finally {
            setBnplLoading(false);
        }
    };

    const handleCheckout = async (paymentMethod: 'CASH' | 'CARD' | 'TABBY' | 'TAMARA') => {
        if (cart.length === 0) return;
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
                alert(`تم دفع الفاتورة بنجاح: ${data.invoice.invoiceNumber}`);
                setCart([]); 
                removeCoupon(); 
                setSelectedCustomer(null); 
                setShowBnplModal(false);
                fetchProducts(); 
            } else {
                alert(data.error || 'حدث خطأ أثناء الدفع');
            }
        } catch (e) {
            alert('حدث خطأ بالاتصال بالسيرفر');
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
                            عودة للوحة التحكم
                        </Link>
                    </div>

                    <div className="search-bar">
                        <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRTL ? 'right' : 'left']: '12px', color: '#a3a3a3' }} />
                        <input 
                            type="text" 
                            placeholder="البحث برقم الباركود أو اسم المنتج..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <span style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>الوردية: #1042 (مفتوحة)</span>
                    </div>
                </header>

                <div className="products-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a3a3a3' }}>
                            جاري تحميل المنتجات...
                        </div>
                    ) : (
                        filteredProducts.slice(0, 100).map((product: any) => (
                            <div key={product.id} className={`product-card ${product.stock <= 0 ? 'disabled' : ''}`} onClick={() => product.stock > 0 && addToCart(product)}>
                                {product.stock <= 0 && <span className="stock-badge">نفد المخزون</span>}
                                <div className="product-icon" style={{ overflow: 'hidden' }}>
                                    {product.img && product.img.length > 2 && (product.img.startsWith('/') || product.img.startsWith('http'))
                                        ? <img src={product.img} alt={product.name} style={{width:'60px', height:'60px', objectFit:'contain', borderRadius:'8px'}} /> 
                                        : <div style={{width:'60px', height:'60px', background:'#2a2a2a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontSize:'0.9rem', fontWeight:'bold'}}>{product.name ? product.name.substring(0,2) : ''}</div>
                                    }
                                </div>
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">{product.price.toLocaleString()} ر.س</div>
                            </div>
                        ))
                    )}
                    {!loading && filteredProducts.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a3a3a3' }}>
                            لا توجد منتجات مطابقة للبحث
                        </div>
                    )}
                </div>
            </div>

            <div className="cart-pane">
                <div className="cart-header">
                    <h2>سلة المشتريات</h2>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        {cart.reduce((a, b) => a + b.qty, 0)} عناصر
                    </span>
                </div>

                <div className="customer-selector">
                    <button className="customer-btn" onClick={() => setShowCustomerModal(true)} style={{ background: selectedCustomer ? 'rgba(34, 197, 94, 0.1)' : '', borderColor: selectedCustomer ? '#22c55e' : '', color: selectedCustomer ? '#22c55e' : '' }}>
                        <User size={18} />
                        {selectedCustomer ? `العميل المربوط: ${selectedCustomer.name}` : 'تحديد العميل (نقاط الولاء)'}
                    </button>
                    {selectedCustomer && (
                        <button onClick={() => setSelectedCustomer(null)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
                            إلغاء ربط العميل
                        </button>
                    )}
                </div>

                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">{item.price} ر.س</span>
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
                            <p>السلة فارغة، ابدأ بإضافة المنتجات</p>
                        </div>
                    )}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>المجموع الفرعي</span>
                        <span>{total.toLocaleString()} ر.س</span>
                    </div>
                    {appliedCoupon && (
                        <div className="summary-row" style={{ color: '#10b981', fontWeight: 'bold' }}>
                            <span>خصم الكوبون ({appliedCoupon.code})</span>
                            <span>- {finalDiscountValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ر.س</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>الضريبة (15%)</span>
                        <span>{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س</span>
                    </div>
                    
                    {/* Coupon Input Box */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <input 
                            type="text" 
                            placeholder="رمز الكوبون" 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
                        />
                        {!appliedCoupon ? (
                            <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                {couponLoading ? '...' : 'تطبيق'}
                            </button>
                        ) : (
                            <button onClick={removeCoupon} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                                إلغاء
                            </button>
                        )}
                    </div>

                    <div className="summary-total">
                        <span>الإجمالي</span>
                        <span>{finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ر.س</span>
                    </div>
                </div>

                <div className="checkout-actions">
                    <button className="pay-btn pay-cash" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CASH')}>
                        <Banknote size={20} /> {isProcessing ? 'جاري...' : 'نقدي'}
                    </button>
                    <button className="pay-btn pay-card" disabled={cart.length === 0 || isProcessing} onClick={() => handleCheckout('CARD')}>
                        <CreditCard size={20} /> {isProcessing ? 'جاري...' : 'شبكة'}
                    </button>
                    <button className="pay-btn" style={{ background: '#3eedbf', color: '#111' }} disabled={cart.length === 0 || isProcessing} onClick={() => startBnplCheckout('tabby')}>
                        <strong>تابي</strong> Tabby
                    </button>
                    <button className="pay-btn" style={{ background: '#ffb5a3', color: '#111' }} disabled={cart.length === 0 || isProcessing} onClick={() => startBnplCheckout('tamara')}>
                        <strong>تمارا</strong> Tamara
                    </button>
                    <button className="pay-btn" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.1)', color: 'white' }} disabled={cart.length === 0 || isProcessing}>
                        <Save size={20} /> حفظ مسودة
                    </button>
                </div>
            </div>

            {/* Customer Selection Modal */}
            {showCustomerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCustomerModal(false)}>
                    <div style={{ background: '#111', width: '500px', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>اختر العميل</h3>
                            <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="البحث بالاسم أو رقم الجوال..." 
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
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>لا يوجد عملاء مطابقين لسجل البحث</div>
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
                            الدفع عبر {bnplProvider === 'tabby' ? 'تابي' : 'تمارا'}
                        </h2>
                        
                        {!bnplUrl ? (
                            <>
                                <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>أدخل رقم جوال العميل لإنشاء جلسة تقسيط للفاتورة البالغة <strong>{finalTotal.toLocaleString()} ر.س</strong></p>
                                <input 
                                    type="text" 
                                    placeholder="رقم الجوال (مثال: 0500000000)" 
                                    value={bnplPhone}
                                    onChange={e => setBnplPhone(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                                />
                                <button 
                                    onClick={handleCreateBnplSession} 
                                    disabled={bnplLoading || !bnplPhone}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: bnplProvider === 'tabby' ? '#3eedbf' : '#ffb5a3', color: '#111', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                                >
                                    {bnplLoading ? 'جاري إنشاء الجلسة...' : 'طلب رمز الدفع QR'}
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <QRCodeCanvas value={bnplUrl} size={250} level="H" includeMargin />
                                </div>
                                <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    اطلب من العميل مسح الرمز أعلاه بكاميرا هاتفه لإكمال التقسيط.<br/>سيبقى الطلب معلقاً حتى يؤكد العميل الدفع.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                    <button 
                                        onClick={() => setShowBnplModal(false)}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #555', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                                    >
                                        إلغاء العملية
                                    </button>
                                    <button 
                                        onClick={() => handleCheckout(bnplProvider.toUpperCase() as any)}
                                        disabled={isProcessing}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        تأكيد الدفع (اعتماد الفاتورة)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
