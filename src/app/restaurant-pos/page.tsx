'use client';

import React, { useState, useEffect } from 'react';
import PosReturnsModal from '@/components/PosReturnsModal';
import { useMadaTerminal } from '@/hooks/useMadaTerminal';
import Link from 'next/link';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2, QrCode, Bell, X as XIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";
import { FeatureGuard } from '@/hooks/FeatureGuard';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function RestaurantPOS() {
    const { t } = useTranslation();
    const { isOffline, OfflineBadge, saveInvoiceWithSync, cacheProducts } = useOfflineSync();
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
    const [showQrModal, setShowQrModal] = useState<any>(null);

    // Allow Negative Stock Setting
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [isTaxInclusive, setIsTaxInclusive] = useState(true);
    const [discountEnabled, setDiscountEnabled] = useState(true);
    const [couponsEnabled, setCouponsEnabled] = useState(true);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [allowAddProduct, setAllowAddProduct] = useState(true);
    const [discountRules, setDiscountRules] = useState<any[]>([]);

    // Pending Orders Notification System
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [lastKnownCount, setLastKnownCount] = useState(0);
    const [notifFlash, setNotifFlash] = useState(false);

    // Floor Management State
    const [posMode, setPosMode] = useState<'MENU' | 'FLOOR'>('FLOOR');
    const [zones, setZones] = useState<any[]>([]);
    const [activeZone, setActiveZone] = useState<any>(null);
    const [activeTable, setActiveTable] = useState<any>(null);

    const fetchFloorPlan = async () => {
        try {
            const res = await fetch('/api/pos/restaurant/floor');
            if (res.ok) {
                const data = await res.json();
                setZones(data.zones || []);
                if (data.zones && data.zones.length > 0 && !activeZone) setActiveZone(data.zones[0]);
            }
        } catch (e) {}
    };

    useEffect(() => {
        if (posMode === 'FLOOR') fetchFloorPlan();
    }, [posMode]);

    const createZone = async () => {
        const name = prompt('اسم المنطقة الجديدة (مثال: العائلات، الأفراد):');
        if (!name) return;
        await fetch('/api/pos/restaurant/floor', { method: 'POST', body: JSON.stringify({ action: 'create_zone', payload: { name } }) });
        fetchFloorPlan();
    };

    const createTable = async () => {
        if (!activeZone) return alert('اختر منطقة أولاً');
        const countStr = prompt('كم عدد الطاولات التي تريد إضافتها؟', '1');
        if (!countStr) return;
        const count = Math.max(1, Math.min(50, parseInt(countStr) || 1));
        const capacity = prompt('عدد المقاعد لكل طاولة:', '4');
        const existingCount = activeZone.tables?.length || 0;
        for (let i = 0; i < count; i++) {
            const tableNum = existingCount + i + 1;
            await fetch('/api/pos/restaurant/floor', { method: 'POST', body: JSON.stringify({ action: 'create_table', payload: { name: `T${tableNum}`, capacity: Number(capacity) || 4, zoneId: activeZone.id } }) });
        }
        fetchFloorPlan();
    };

    const openTableSession = async (table: any) => {
        if (table.status === 'Available') {
            await fetch('/api/pos/restaurant/floor', { method: 'POST', body: JSON.stringify({ action: 'open_session', payload: { tableId: table.id } }) });
        }
        setActiveTable(table);
        setPosMode('MENU');
        fetchFloorPlan();
    };

    const closeTableSession = async (e: React.MouseEvent, table: any) => {
        e.stopPropagation();
        if (!confirm(`هل تريد تحرير الطاولة ${table.name}؟`)) return;
        await fetch('/api/pos/restaurant/floor', { method: 'POST', body: JSON.stringify({ action: 'close_session', payload: { tableId: table.id } }) });
        if (activeTable?.id === table.id) { setActiveTable(null); setCart([]); }
        fetchFloorPlan();
    };

    const initSettings = async () => { try { const res = await fetch('/api/settings'); if (res.ok) { const data = await res.json(); const getVal = (key: string, def: string) => { if (Array.isArray(data)) { const s = data.find((x: any) => x.key === key); return s ? s.value : def; } else { return data[key] !== undefined ? String(data[key]) : def; } }; setTaxRate(Number(getVal('tax_rate', '15')) || 0); setAllowNegativeStock(getVal('POS_ALLOW_NEGATIVE_STOCK', 'false') === 'true'); setIsTaxInclusive(getVal('POS_TAX_INCLUSIVE', 'true') !== 'false'); setDiscountEnabled(getVal('POS_DISCOUNT_ENABLED', 'true') !== 'false'); setCouponsEnabled(getVal('POS_COUPONS_ENABLED', 'true') !== 'false'); setTaxEnabled(getVal('POS_TAX_ENABLED', 'true') !== 'false'); setAllowAddProduct(getVal('POS_ALLOW_ADD_PRODUCT', 'true') !== 'false'); try { const rules = JSON.parse(getVal('POS_DISCOUNT_RULES', '[]')); if (Array.isArray(rules)) setDiscountRules(rules); } catch(e) {} } } catch (e) {} }; useEffect(() => { initSettings(); }, []);
    useEffect(() => {
        const saved = localStorage.getItem('rest_held_orders');
        if (saved) {
            try { setHeldOrders(JSON.parse(saved)); } catch (e) {}
        }
    }, []);

    // ═══ Audio Context (init on first user click to bypass browser restriction) ═══
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    useEffect(() => {
        const initAudio = () => {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        };
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        return () => { document.removeEventListener('click', initAudio); document.removeEventListener('touchstart', initAudio); };
    }, []);

    const playOrderBell = () => {
        // Play loud bell ring 3 times
        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const ringBell = (delay: number) => {
            // First tone (high)
            const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
            osc1.connect(g1); g1.connect(ctx.destination);
            osc1.frequency.value = 1200; osc1.type = 'sine';
            g1.gain.setValueAtTime(0.6, ctx.currentTime + delay);
            g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
            osc1.start(ctx.currentTime + delay); osc1.stop(ctx.currentTime + delay + 0.3);

            // Second tone (low)
            const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
            osc2.connect(g2); g2.connect(ctx.destination);
            osc2.frequency.value = 900; osc2.type = 'sine';
            g2.gain.setValueAtTime(0.6, ctx.currentTime + delay + 0.15);
            g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.45);
            osc2.start(ctx.currentTime + delay + 0.15); osc2.stop(ctx.currentTime + delay + 0.45);
        };

        // Ring 3 times with gaps
        ringBell(0);
        ringBell(0.6);
        ringBell(1.2);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 طلب جديد من المنيو!', { body: 'وصل طلب جديد من المنيو الإلكتروني', icon: '/favicon.ico' });
        }
    };

    // ═══ Pending Orders Polling (every 8s) ═══
    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/pos/pending-orders');
                const data = await res.json();
                if (data.success && data.orders) {
                    const newOrders = data.orders;
                    if (newOrders.length > lastKnownCount && lastKnownCount >= 0) {
                        playOrderBell();
                        setNotifFlash(true);
                        setTimeout(() => setNotifFlash(false), 5000);
                    }
                    setLastKnownCount(newOrders.length);
                    setPendingOrders(newOrders);
                }
            } catch (e) {}
        };
        fetchPending();
        const interval = setInterval(fetchPending, 8000);
        return () => clearInterval(interval);
    }, [lastKnownCount]);

    const handleOrderAction = async (invoiceId: number, action: 'approve' | 'reject') => {
        try {
            const order = pendingOrders.find(o => o.id === invoiceId);
            const res = await fetch('/api/pos/pending-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, invoiceId }) });
            const data = await res.json();
            setPendingOrders(prev => prev.filter(o => o.id !== invoiceId));
            setLastKnownCount(prev => Math.max(0, prev - 1));

            if (action === 'approve' && data.success) {
                // 1) Print tax invoice on main printer (with QR)
                setCompletedInvoiceId(invoiceId);

                // 2) Print kitchen ticket on secondary printers (without QR)
                if (order) {
                    const kitchenHtml = `
                        <html dir="rtl"><head><title>تذكرة مطبخ</title>
                        <style>
                            body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 10px; }
                            h2 { text-align: center; margin: 5px 0; border-bottom: 2px dashed #000; padding-bottom: 8px; }
                            .table-info { text-align: center; font-size: 20px; font-weight: bold; background: #000; color: #fff; padding: 8px; margin: 8px 0; border-radius: 4px; }
                            .time { text-align: center; color: #666; font-size: 12px; margin-bottom: 10px; }
                            .item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; font-size: 14px; }
                            .item-qty { font-weight: bold; font-size: 16px; }
                            .notes { background: #fff3cd; padding: 6px; margin-top: 8px; font-size: 12px; border-radius: 4px; }
                            .footer { text-align: center; margin-top: 10px; border-top: 2px dashed #000; padding-top: 8px; font-size: 11px; color: #999; }
                        </style></head><body>
                        <h2>🍳 تذكرة مطبخ</h2>
                        <div class="table-info">🍽️ ${order.notes?.match(/طاولة[:\s]*([^\|]+)/)?.[1]?.trim() || 'طلب إلكتروني'}</div>
                        <div class="time">⏰ ${new Date().toLocaleTimeString('en-GB')} | #${order.invoiceNo}</div>
                        ${order.details?.map((d: any) => `
                            <div class="item">
                                <span>${d.productName}</span>
                                <span class="item-qty">×${d.quantity}</span>
                            </div>
                        `).join('') || ''}
                        ${order.notes?.includes('ملاحظات') ? `<div class="notes">📝 ${order.notes.match(/ملاحظات[:\s]*([^\|]+)/)?.[1] || ''}</div>` : ''}
                        <div class="footer">طلب من المنيو الإلكتروني</div>
                        <script>window.print(); setTimeout(() => window.close(), 1000);</script>
                        </body></html>`;
                    const kitchenWin = window.open('', '_blank', 'width=320,height=500');
                    if (kitchenWin) kitchenWin.document.write(kitchenHtml);
                }
            }
        } catch (e) { alert('حدث خطأ'); }
    };

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
            time: new Date().toLocaleTimeString('en-GB')
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
            if (isOffline) {
                // Fetch from Local SQLite
                if (typeof window !== 'undefined' && (window as any).electron) {
                    const localProducts = await (window as any).electron.invoke('offline-db-search-products');
                    if (localProducts && localProducts.length > 0) {
                        setProducts(localProducts);
                        const catsMap = new Map();
                        localProducts.forEach((p:any) => { if(p.categoryId) catsMap.set(p.categoryId, p.categoryName); });
                        const cats = [{id: t('pos.all'), name: t('sys.str_4068')}, ...Array.from(catsMap.entries()).map(([id,name])=>({id,name}))];
                        setCategories(cats);
                    }
                }
                return;
            }

            const res = await fetch('/api/pos/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
                const cats = [{id: t('pos.all'), name: t('sys.str_4068')}, ...data.categories];
                setCategories(cats);
                // Cache for offline use
                cacheProducts(data.products || []);
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
        if (!allowNegativeStock && product.stock <= 0) {
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
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr).id : null;

            const mappedPaymentType = paymentMethod === 'CASH' ? 'cash' : 
                                      paymentMethod === 'CARD' ? 'card' : 
                                      paymentMethod === 'TRANSFER' ? 'transfer' : 
                                      paymentMethod === 'SPLIT' ? 'split' : 'cash';

            const body = {
                items: cart.map((item: any) => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.qty,
                    price: item.price,
                    discountRate: 0
                })),
                customerId: selectedCustomer ? selectedCustomer.id : null,
                stockId: 1,
                paymentType: mappedPaymentType,
                splitCash: paymentMethod === 'SPLIT' ? Number(splitCash) : 0,
                splitCard: paymentMethod === 'SPLIT' ? Number(splitCard) : 0,
                discountRate: finalDiscountValue > 0 ? ((finalDiscountValue / total) * 100).toFixed(2) : 0,
                userId: userId,
                isTaxInclusive: isTaxInclusive,
                taxRate: taxEnabled ? taxRate : 0,
                notes: activeTable ? `طاولة: ${activeTable.name}` : 'Restaurant POS Sale'
            };
            const data = await saveInvoiceWithSync(body, '/api/sales');
            if (data && data.success) {
                if (data.offline) {
                    setCompletedInvoiceId(Number(data.uuid)); // For offline printing logic if needed
                } else {
                    setCompletedInvoiceId(data.id || data.invoice?.id || data.invoiceId);
                }
                
                setCart([]); // clear cart
                removeCoupon(); // clear active coupon
                setSelectedCustomer(null); // clear linked customer
                setNumpadValue('');
                if (!isOffline) fetchProducts(); // refresh stock only if online
            } else {
                alert(data?.error || t('sys.str_4075'));
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
    const tax = taxEnabled ? (isTaxInclusive 
        ? total - (total / (1 + (taxRate / 100))) 
        : total * (taxRate / 100)) : 0;
    
    // Calculate final with coupon
    let finalDiscountValue = 0;
    if (appliedCoupon && discountEnabled) {
        if (appliedCoupon.discountType === 'percentage') {
            finalDiscountValue = total * (appliedCoupon.discountValue / 100);
        } else {
            finalDiscountValue = appliedCoupon.discountValue;
        }
        
        if (discountRules && discountRules.length > 0) {
            let maxAllowed = Infinity;
            // Find highest applicable rule based on total
            const applicableRule = [...discountRules].reverse().find((r: any) => total >= r.minAmount);
            if (applicableRule) {
                const maxByValue = applicableRule.maxDiscount || Infinity;
                const maxByPercent = applicableRule.maxDiscountPercent ? (total * applicableRule.maxDiscountPercent / 100) : Infinity;
                maxAllowed = Math.min(maxByValue, maxByPercent);
                if (finalDiscountValue > maxAllowed) {
                    finalDiscountValue = maxAllowed;
                }
            } else {
                finalDiscountValue = 0; // No rule met minAmount
            }
        }
    }
    const finalTotal = isTaxInclusive 
        ? Math.max(0, total - finalDiscountValue) 
        : Math.max(0, total + tax - finalDiscountValue);

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
                        <OfflineBadge />
                        
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
                        
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                            <button onClick={() => setPosMode('MENU')} style={{ background: posMode === 'MENU' ? '#fff' : 'transparent', color: posMode === 'MENU' ? '#3b82f6' : '#64748b', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: posMode === 'MENU' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                                القائمة
                            </button>
                            <button onClick={() => setPosMode('FLOOR')} style={{ background: posMode === 'FLOOR' ? '#fff' : 'transparent', color: posMode === 'FLOOR' ? '#3b82f6' : '#64748b', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: posMode === 'FLOOR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                                خريطة الطاولات
                            </button>
                        </div>
                        {/* Notification Bell */}
                        <button onClick={() => setShowPendingModal(true)} style={{ position: 'relative', background: notifFlash ? '#ef4444' : pendingOrders.length > 0 ? '#f59e0b' : '#e2e8f0', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: notifFlash ? 'pulse 0.5s ease-in-out infinite' : 'none', transition: 'all 0.3s' }}>
                            <Bell size={20} color={pendingOrders.length > 0 ? 'white' : '#64748b'} />
                            {pendingOrders.length > 0 && (
                                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 900, borderRadius: '10px', padding: '1px 5px', minWidth: '18px', textAlign: 'center' }}>{pendingOrders.length}</span>
                            )}
                        </button>
                        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`}</style>
                    </div>
                    <input 
                        className="search-input"
                        type="text" 
                        placeholder={t('sys.str_4114')} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {posMode === 'MENU' ? (
                    <div className="products-grid">
                        {loading ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                                {t('sys.str_4086')}</div>
                        ) : filteredProducts.slice(0, 100).map((product: any) => (
                            <div 
                                key={product.id} 
                                className="product-card"
                                onClick={() => addToCart(product)}
                                style={{ opacity: (!allowNegativeStock && product.stock <= 0) ? 0.6 : 1 }}
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
                ) : (
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                            {zones.map(z => (
                                <button key={z.id} onClick={() => setActiveZone(z)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: activeZone?.id === z.id ? '#3b82f6' : '#fff', color: activeZone?.id === z.id ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {z.name} ({z.tables?.length || 0})
                                </button>
                            ))}
                            <button onClick={createZone} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed #94a3b8', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة منطقة</button>
                        </div>
                        <div style={{ flex: 1, background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem', alignContent: 'start' }}>
                            {activeZone?.tables?.map((t: any) => {
                                const isOccupied = t.status === 'Occupied';
                                const isReserved = t.status === 'Reserved';
                                const bgColor = isOccupied ? '#fee2e2' : isReserved ? '#fef3c7' : '#dcfce3';
                                const borderColor = isOccupied ? '#ef4444' : isReserved ? '#f59e0b' : '#22c55e';
                                const textColor = isOccupied ? '#991b1b' : isReserved ? '#b45309' : '#166534';
                                return (
                                <div key={t.id} onClick={() => openTableSession(t)} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '16px', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: textColor }}>{t.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: textColor, opacity: 0.8, marginTop: '0.25rem' }}>{t.capacity} مقاعد</div>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.5)', color: textColor }}>
                                        {isOccupied ? 'مشغولة' : isReserved ? 'محجوزة' : 'متاحة'}
                                    </div>
                                    {isOccupied && (
                                        <button onClick={(e) => closeTableSession(e, t)} style={{ marginTop: '0.5rem', background: '#22c55e', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                            ✓ تحرير الطاولة
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setShowQrModal(t); }} style={{ marginTop: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <QrCode size={12} /> المنيو
                                    </button>
                                    {activeTable?.id === t.id && <div style={{ position: 'absolute', top: -8, right: -8, background: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></div>}
                                </div>
                            )})}
                            {activeZone && (
                                <div onClick={createTable} style={{ background: 'transparent', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>إضافة طاولة</div>
                                </div>
                            )}
                            {!activeZone && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>اختر منطقة لعرض الطاولات</div>}
                        </div>
                    </div>
                )}
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
                    {activeTable && (
                        <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <span>الطاولة: {activeTable.name}</span>
                            <button onClick={() => { setActiveTable(null); setCart([]); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="إلغاء ارتباط الطاولة"><Trash2 size={14}/></button>
                        </div>
                    )}
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
                {couponsEnabled && (
                <FeatureGuard featureKey="pos_coupon_module">
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
                </FeatureGuard>
                )}

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
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(inv.date).toLocaleString('en-GB')} {t('sys.str_4057')}{inv.customer?.name || t('sys.str_4081')}</div>
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

            {/* ═══ PENDING ORDERS MODAL (Digital Menu Orders) ═══ */}
            {showPendingModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPendingModal(false)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', width: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>🔔 طلبات المنيو الإلكتروني ({pendingOrders.length})</h3>
                            <button onClick={() => setShowPendingModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}><XIcon size={18} /></button>
                        </div>
                        {pendingOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>لا توجد طلبات معلقة</div>
                        ) : (
                            pendingOrders.map((order: any) => (
                                <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 900, color: '#3b82f6' }}>#{order.invoiceNo}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(order.date).toLocaleTimeString('en-GB')}</span>
                                    </div>
                                    {order.notes && (
                                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#92400e' }}>
                                            {order.notes}
                                        </div>
                                    )}
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        {order.details?.map((d: any) => (
                                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                                                <span>{d.productName} × {d.quantity}</span>
                                                <span style={{ fontWeight: 'bold' }}>{d.total?.toLocaleString()} ر.س</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                        <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem' }}>{order.total?.toLocaleString()} ر.س</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleOrderAction(order.id, 'reject')} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>رفض</button>
                                            <button onClick={() => handleOrderAction(order.id, 'approve')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>✓ موافقة</button>
                                        </div>
                                    </div>
                                </div>
                            ))
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

            {/* QR Code Modal for Table Menu */}
            {showQrModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowQrModal(null)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#1e293b' }}>📱 منيو طاولة {showQrModal.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>امسح الباركود لفتح المنيو الإلكتروني</p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', background: '#f8fafc', borderRadius: '16px', padding: '1.5rem' }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${showQrModal.id}`} size={200} level="H" />
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', direction: 'ltr', wordBreak: 'break-all' }}>
                            {typeof window !== 'undefined' ? window.location.origin : ''}/menu/{showQrModal.id}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button onClick={() => {
                                const canvas = document.querySelector('#qr-modal canvas') as HTMLCanvasElement;
                                if (!canvas) return;
                                const win = window.open('', '_blank');
                                if (!win) return;
                                win.document.write(`<html dir="rtl"><head><title>QR - ${showQrModal.name}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}</style></head><body><h1>طاولة ${showQrModal.name}</h1><img src="${canvas.toDataURL()}" /><p>امسح الباركود لفتح المنيو</p><script>window.print()</script></body></html>`);
                            }} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Printer size={16} /> طباعة
                            </button>
                            <button onClick={() => setShowQrModal(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>
            )}
        </div>
    );
}
