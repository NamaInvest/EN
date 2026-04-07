'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2 } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function RestaurantPOS() {
    const { t } = useTranslation();
    // Force RTL for this specific layout to match image perfectly
    const isRTL = true;

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

    // Hold & History State
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

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

    const generateReceiptContent = (invoice: any, renderCart: any[], renderTotal: number, renderTax: number, renderDiscount: number) => {
        return `
            <div dir="rtl" style="font-family: 'Courier New', Courier, monospace; padding: 10px; font-size: 13px; margin: 0 auto; max-width: 300px; text-align: center; color: #000; background: #fff;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">نمـا إنفست للأنظمـة</div>
                <div style="font-size: 11px; margin-bottom: 10px;">طلب نقاط البيع - مطاعم</div>
                <div style="font-size: 12px">رقم الإيصال: ${invoice?.invoiceNumber || '-'}</div>
                <div style="font-size: 12px">التاريخ: ${new Date().toLocaleString('ar-SA')}</div>
                <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
                <table style="width: 100%; text-align: right; border-collapse: collapse; margin-bottom: 5px;">
                    <thead>
                        <tr>
                            <th style="padding: 4px 0;">الصنف</th>
                            <th style="width: 30px; text-align: center; padding: 4px 0;">الكمية</th>
                            <th style="width: 60px; text-align: left; padding: 4px 0;">القيمة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderCart.map((item: any) => `
                            <tr>
                                <td style="padding: 4px 0;">${item.name}</td>
                                <td style="width: 30px; text-align: center; padding: 4px 0;">${item.qty}</td>
                                <td style="width: 60px; text-align: left; padding: 4px 0;">${(item.price * item.qty).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
                <table style="width: 100%; text-align: right; border-collapse: collapse; margin-bottom: 5px; font-weight: bold;">
                    <tr><td style="padding: 4px 0;">الإجمالي:</td><td style="text-align: left; padding: 4px 0;">${renderTotal.toLocaleString()}</td></tr>
                    <tr style="font-weight: normal;"><td style="padding: 4px 0;">الخصم:</td><td style="text-align: left; padding: 4px 0;">${renderDiscount.toLocaleString()}</td></tr>
                    <tr style="font-weight: normal;"><td style="padding: 4px 0;">ضريبة (15%):</td><td style="text-align: left; padding: 4px 0;">${renderTax.toLocaleString()}</td></tr>
                    <tr style="font-size: 16px;"><th style="padding: 4px 0;">الصافي (SAR):</th><th style="text-align: left; padding: 4px 0;">${Math.max(0, renderTotal + renderTax - renderDiscount).toLocaleString()}</th></tr>
                </table>
                <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
                ${invoice?.zatcaQr ? `<img src="${invoice.zatcaQr}" style="width: 120px; height: 120px; margin-top: 10px;" />` : ''}
                <div style="font-size: 11px; margin-top: 15px;">شكراً لزيارتكم!</div>
            </div>
        `;
    };

    const printReceipt = (invoice: any, printCart: any[], printTotal: number, printTax: number, printDiscount: number) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '-9999px';
        iframe.style.bottom = '-9999px';
        iframe.style.width = '400px';
        iframe.style.height = '600px';
        document.body.appendChild(iframe);
        
        const content = generateReceiptContent(invoice, printCart, printTotal, printTax, printDiscount);
        
        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(t('sys.str_4113') + content + '</body></html>');
            doc.close();
        }

        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            setTimeout(() => { document.body.removeChild(iframe); }, 5000);
        }, 800);
    };

    const exportToPDF = (invoice: any, exportCart: any[], exportTotal: number, exportTax: number, exportDiscount: number) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            const content = generateReceiptContent(invoice, exportCart, exportTotal, exportTax, exportDiscount);
            const element = document.createElement('div');
            element.innerHTML = content;
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            document.body.appendChild(element);
            
            // @ts-ignore
            window.html2pdf().from(element.firstElementChild).set({
                margin: 5,
                filename: `Invoice_${invoice?.invoiceNumber || Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: [80, 250], orientation: 'portrait' }
            }).save().then(() => {
                document.body.removeChild(element);
            });
        };
        document.body.appendChild(script);
    };

    const [isProcessing, setIsProcessing] = useState(false);
    const [showMadaModal, setShowMadaModal] = useState(false);
    const [madaStatus, setMadaStatus] = useState<'WAITING'|'APPROVED'|'REJECTED'>('WAITING');

    const handleCheckout = async (paymentMethod: 'CASH' | 'CARD') => {
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
                // Trigger localized thermal receipt printing engine immediately
                printReceipt(data.invoice, cart, total, tax, finalDiscountValue);
                
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
                alert(`تم تطبيق الكوبون بنجاح بخصم ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + t('sys.str_4105')}`);
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

    return (
        <div className="restaurant-pos" dir="rtl">
            <style jsx>{`
                .restaurant-pos {
                    display: flex;
                    height: 100vh;
                    background: #f0f2f5;
                    font-family: 'Inter', system-ui, sans-serif;
                    overflow: hidden;
                    color: #333;
                }
                
                /* Left Column: Categories */
                .categories-pane {
                    width: 140px;
                    background: #ffffff;
                    border-left: 1px solid #ddd;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    box-shadow: 2px 0 5px rgba(0,0,0,0.05);
                    z-index: 10;
                }
                .category-btn {
                    padding: 1.2rem 0.5rem;
                    border: none;
                    border-bottom: 1px solid #eee;
                    background: #fff;
                    color: #444;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                }
                .category-btn:hover { background: #f8f9fa; }
                .category-btn.active {
                    background: #22c55e;
                    color: white;
                    border-left: 4px solid #16a34a;
                }

                /* Center Column: Products Grid */
                .main-pane {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #f8f9fa;
                }
                .top-bar {
                    height: 60px;
                    background: #fff;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    justify-content: space-between;
                }
                .search-input {
                    padding: 0.5rem 1rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    width: 300px;
                    outline: none;
                }
                .products-grid {
                    flex: 1;
                    padding: 1rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 1rem;
                    overflow-y: auto;
                    align-content: start;
                }
                .product-card {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.1s, box-shadow 0.1s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 180px;
                }
                .product-card:active { transform: scale(0.97); }
                .product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #22c55e; }
                .product-img-wrapper {
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.5rem;
                    font-size: 2.5rem;
                }
                .product-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: auto;
                    color: #333;
                }
                .product-price {
                    font-weight: 700;
                    color: #16a34a;
                    margin-top: 0.5rem;
                }

                /* Right Column: Cart & Numpad */
                .cart-pane {
                    width: 380px;
                    background: #fff;
                    border-right: 1px solid #ddd;
                    display: flex;
                    flex-direction: column;
                }
                
                .cart-totals-banner {
                    background: #111;
                    color: #10b981;
                    padding: 1rem;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .banner-row {
                    display: flex;
                    justify-content: space-between;
                    color: white;
                    font-size: 0.9rem;
                }
                .banner-grand {
                    display: flex;
                    justify-content: space-between;
                    color: #22c55e;
                    font-size: 1.8rem;
                    font-weight: bold;
                    margin-top: 0.5rem;
                }

                .cart-table {
                    flex: 1;
                    overflow-y: auto;
                    background: #f9fafb;
                }
                .cart-table th {
                    background: #f1f5f9;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                    color: #64748b;
                    text-align: right;
                    border-bottom: 1px solid #e2e8f0;
                    position: sticky;
                    top: 0;
                }
                .cart-row {
                    display: flex;
                    padding: 0.75rem 0.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    align-items: center;
                }
                .col-name { flex: 2; font-size: 0.9rem; font-weight: 600; color: #333; }
                .col-qty { flex: 1; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
                .col-price { flex: 1; text-align: center; font-size: 0.9rem; color: #666; }
                .col-total { flex: 1; text-align: left; font-weight: 700; color: #16a34a; }
                
                .qty-circle {
                    width: 24px; height: 24px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    font-weight: bold; color: #333;
                    border: none;
                }

                /* Numpad Section */
                .numpad-section {
                    padding: 1rem;
                    background: #e2e8f0;
                    display: flex;
                    gap: 1rem;
                }
                .pay-btn-big {
                    flex: 1;
                    background: #22c55e;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.8rem;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px rgba(34,197,94,0.3);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }
                .pay-btn-big:active { transform: translateY(2px); box-shadow: none; }
                .pay-btn-big:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }

                .numpad-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.35rem;
                    width: 180px;
                }
                .numpad-btn {
                    background: white;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0.75rem 0;
                    font-size: 1.25rem;
                    font-weight: bold;
                    cursor: pointer;
                    color: #334155;
                    box-shadow: 0 2px 0 #cbd5e1;
                }
                .numpad-btn:active {
                    transform: translateY(2px);
                    box-shadow: none;
                }
                
                /* Responsive tweaks */
                @media (max-width: 1024px) {
                    .restaurant-pos { flex-direction: column; }
                    .categories-pane { width: 100%; height: 60px; flex-direction: row; border-left: none; border-bottom: 1px solid #ddd; }
                    .category-btn { padding: 0.5rem 1.5rem; white-space: nowrap; border-bottom: none; border-left: 1px solid #eee; }
                    .category-btn.active { border-left: none; border-bottom: 4px solid #16a34a; }
                    .cart-pane { width: 100%; height: 50vh; border-right: none; border-top: 1px solid #ddd; }
                }
            `}</style>

            {/* LEFT CATEGORIES */}
            <div className="categories-pane">
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        className={`category-btn \${activeCategory === cat.id ? 'active' : ''}`}
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
                        {selectedCustomer ? `العميل: ${selectedCustomer.name}` : t('sys.str_4115')}
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
                                            <span>{item.qty}</span>
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

                <div className="numpad-section">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button 
                            onClick={handleHoldOrder}
                            disabled={cart.length === 0}
                            style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(245,158,11,0.2)' }}
                        >
                            <Clock size={18} /> {t('sys.str_4098')}</button>
                        <button 
                            className="pay-btn-big" 
                            disabled={cart.length === 0 || isProcessing}
                            onClick={() => handleCheckout('CASH')}
                            style={{ flex: 1, fontSize: '1.2rem' }}
                        >
                            <span style={{ fontSize: '1rem', marginBottom: '-5px' }}>{t('sys.str_4099')}</span>
                            <span style={{ fontSize: '1.6rem' }}>CASH</span>
                        </button>
                        <button 
                            className="pay-btn-big" 
                            disabled={cart.length === 0 || isProcessing}
                            onClick={() => handleCheckout('CARD')}
                            style={{ flex: 1, background: '#3b82f6', fontSize: '1.2rem' }}
                        >
                            <span style={{ fontSize: '1rem', marginBottom: '-5px' }}>{t('sys.str_4100')}</span>
                            <span style={{ fontSize: '1.6rem' }}>MADA ✔</span>
                        </button>
                    </div>

                    <div className="numpad-grid">
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
                    <span>{numpadValue ? `المدخل: ${numpadValue}` : t('sys.str_4117')}</span>
                    <span>{t('sys.str_4101')}</span>
                </div>
            </div>

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
                                        <button onClick={() => { 
                                            const printCart = (inv.details || []).map((d: any) => ({
                                                name: d.productName,
                                                qty: d.quantity,
                                                price: d.price
                                            }));
                                            printReceipt(
                                                { invoiceNumber: `INV-${inv.invoiceNo}`, zatcaQr: inv.zatcaQr },
                                                printCart,
                                                inv.subtotal,
                                                inv.taxValue,
                                                inv.discountValue
                                            );
                                        }} style={{ background: '#22c55e', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>{t('sys.str_4108')}</button>
                                        
                                        <button onClick={() => { 
                                            const printCart = (inv.details || []).map((d: any) => ({
                                                name: d.productName,
                                                qty: d.quantity,
                                                price: d.price
                                            }));
                                            exportToPDF(
                                                { invoiceNumber: `INV-${inv.invoiceNo}`, zatcaQr: inv.zatcaQr },
                                                printCart,
                                                inv.subtotal,
                                                inv.taxValue,
                                                inv.discountValue
                                            );
                                        }} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>{t('sys.str_4109')}</button>
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
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p style={{ color: '#64748b', margin: 0, fontWeight: 600 }}>{t('sys.str_4110')}</p>
                            </div>
                        )}

                        {madaStatus === 'APPROVED' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem', animation: 'fadeIn 0.3s ease-in-out' }}>
                                <div style={{ width: '64px', height: '64px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <p style={{ color: '#10b981', margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{t('sys.str_4062')}</p>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{t('sys.str_4111')}</p>
                            </div>
                        )}
                        
                        {madaStatus === 'WAITING' && (
                            <button onClick={() => setShowMadaModal(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', marginTop: '1rem', cursor: 'pointer', fontWeight: 600 }}>{t('sys.str_4046')}</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
