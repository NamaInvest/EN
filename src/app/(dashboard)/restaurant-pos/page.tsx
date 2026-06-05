'use client';

import React, { useState, useEffect } from 'react';
import AddCustomerModal from '@/components/pos/AddCustomerModal';
import PosReturnsModal from '@/components/PosReturnsModal';
import { useMadaTerminal } from '@/hooks/useMadaTerminal';
import Link from 'next/link';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2, QrCode, Bell, X as XIcon, Grid, Utensils, LayoutDashboard, Plus, Minus, RefreshCcw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";
import { FeatureGuard } from '@/hooks/FeatureGuard';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useToast } from '@/components/Toast';

export default function RestaurantPOS() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const { isOffline, OfflineBadge, saveInvoiceWithSync, cacheProducts } = useOfflineSync();
    // Force RTL for this specific layout to match image perfectly
    const isRTL = true;

    const [searchQuery, setSearchQuery] = useState('');
    const [taxRate, setTaxRate] = useState(15);
    const { status: madaTermStatus, connect: connectMada, disconnect: disconnectMada, sendPayment: sendMadaPayment } = useMadaTerminal();
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showReturnsModal, setShowReturnsModal] = useState(false);
    const [completedInvoiceId, setCompletedInvoiceId] = useState<number | null>(null);

    // Coupons Engine State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Customer Selector State
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
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
        if (posMode === 'FLOOR') {
            fetchFloorPlan();
            const interval = setInterval(fetchFloorPlan, 10000);
            return () => clearInterval(interval);
        }
    }, [posMode]);

    const createZone = async () => {
        const name = prompt('اسم المنطقة الجديدة (مثال: العائلات، الأفراد):');
        if (!name) return;
        await fetch('/api/pos/restaurant/floor', { method: 'POST', body: JSON.stringify({ action: 'create_zone', payload: { name } }) });
        fetchFloorPlan();
    };

    const createTable = async () => {
        if (!activeZone) return toastError('اختر منطقة أولاً');
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

    const printQR = (e: any, table: any) => {
        e.stopPropagation();
        const token = table.qrToken || 'NO_TOKEN';
        const link = `${window.location.origin}/customer/table/${token}`;
        const qrHtml = `
            <html dir="rtl"><head><title>QR طاولة</title>
            <style>
                body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; text-align: center; padding: 20px 0; }
                h2 { font-size: 24px; margin-bottom: 5px; }
                .qr-image { margin: 20px auto; width: 200px; height: 200px; display: block; border: 1px solid #eee; padding: 5px; border-radius: 8px; }
                .footer { font-size: 14px; margin-top: 10px; color: #555; }
            </style></head><body>
            <h2>طاولة ${table.name}</h2>
            <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}" alt="QR Code" />
            <div class="footer">امسح الباركود لاستعراض المنيو واستدعاء النادل</div>
            <script>setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 500);</script>
            </body></html>`;
        const qrWin = window.open('', '_blank', 'width=320,height=500');
        if (qrWin) qrWin.document.write(qrHtml);
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
        } catch (e) { toastError('حدث خطأ'); }
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
        toastSuccess(t('sys.str_4112'));
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
            toastError(t('sys.str_4069'));
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
            toastError(t('sys.str_4070'));
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
                toastError(data?.error || t('sys.str_4075'));
            }
        } catch (e) {
            toastError(t('sys.str_4076'));
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
                toastSuccess(`${t('pos.coupon_success')}  ${data.discountType === 'percentage' ? data.discountValue + '%' : data.discountValue + t('sys.str_4105')}`);
            } else {
                toastError(data.error);
                setAppliedCoupon(null);
            }
        } catch {
            toastError(t('sys.str_4071'));
        }
        setCouponLoading(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
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

    const totalAfterDiscount = Math.max(0, total - finalDiscountValue);

    const tax = taxEnabled ? (isTaxInclusive 
        ? totalAfterDiscount - (totalAfterDiscount / (1 + (taxRate / 100))) 
        : totalAfterDiscount * (taxRate / 100)) : 0;

    const finalTotal = isTaxInclusive 
        ? totalAfterDiscount 
        : totalAfterDiscount + tax;

    const baseTax = taxEnabled ? (isTaxInclusive ? total - (total / (1 + (taxRate / 100))) : total * (taxRate / 100)) : 0;
    const displaySubtotal = isTaxInclusive ? (total - baseTax) : total;
    const displayDiscount = isTaxInclusive ? (finalDiscountValue - (finalDiscountValue - (finalDiscountValue / (1 + (taxRate / 100))))) : finalDiscountValue;

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
        <div className="flex h-[calc(100vh-4rem)] bg-[#F9FAFB] text-slate-800 overflow-hidden font-sans selection:bg-orange-500/30 relative" dir="rtl">
            
            {/* LEFT CATEGORIES PANEL (Light Minimalist) */}
            <div className="hidden md:flex w-28 bg-white border-l border-slate-200 flex-col items-center py-6 gap-3 z-10 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
                <div className="text-3xl mb-4 font-black text-slate-800 tracking-tighter drop-shadow-sm">POS</div>
                
                <div className="flex-1 w-full overflow-y-auto hide-scrollbar flex flex-col gap-3 px-3">
                    {categories.map((cat: any) => {
                        const isActive = activeCategory === cat.id || activeCategory === cat.name;
                        return (
                            <button 
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id === t('pos.all') ? t('sys.str_4068') : cat.id)}
                                className={`w-full aspect-square rounded-[1.25rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02] border-0' : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200 shadow-sm'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100/50'}`}>
                                    <Grid className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-center leading-tight px-1">
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* HEADER */}
                <div className="min-h-[6rem] md:h-24 bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 rounded-[1.25rem] bg-white text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow-md">
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">نقطة البيع (مطاعم)</h2>
                            <div className="text-sm font-semibold text-slate-400 mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                متصل
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        <div className="relative w-full sm:w-auto">
                            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ابحث عن منتج أو باركود..."
                                className="w-full sm:w-72 md:w-80 pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-semibold shadow-inner"
                            />
                        </div>
                        
                        {/* RESTAURANT SPECIFIC BUTTONS */}
                        {typeof posMode !== 'undefined' && (
                            <div className="flex bg-slate-100 p-1 rounded-[1.25rem] border border-slate-200 shadow-inner">
                                <button 
                                    onClick={() => setPosMode('MENU')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${posMode === 'MENU' ? 'bg-white text-orange-500 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    القائمة
                                </button>
                                <button 
                                    onClick={() => setPosMode('FLOOR')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${posMode === 'FLOOR' ? 'bg-white text-orange-500 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    الطاولات
                                </button>
                            </div>
                        )}

                        <button onClick={() => { if(typeof setShowCustomerModal !== 'undefined') setShowCustomerModal(true); }} className="flex items-center justify-center px-5 h-12 gap-2 rounded-[1.25rem] bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 hover:border-orange-200 border border-slate-200 shadow-sm transition-all font-bold w-full sm:w-auto">
                            <User className="w-5 h-5" />
                            {typeof selectedCustomer !== 'undefined' && selectedCustomer ? selectedCustomer.name : 'عميل نقدي'}
                        </button>

                    </div>
                </div>

                {/* MOBILE CATEGORIES ROW (Horizontal Scrollable) */}
                <div className="md:hidden flex gap-2 overflow-x-auto p-4 bg-white border-b border-slate-200 shrink-0 scrollbar-none">
                    {categories.map((cat: any) => {
                        const isActive = activeCategory === cat.id || activeCategory === cat.name;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id === t('pos.all') ? t('sys.str_4068') : cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* GRID OR TABLES */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-[#F9FAFB]">
                    {typeof posMode !== 'undefined' && posMode === 'FLOOR' ? (
                        <div className="flex flex-col gap-6 w-full h-full">
                            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                    {zones.map((z: any) => (
                                        <button 
                                            key={z.id} 
                                            onClick={() => setActiveZone(z)}
                                            className={`px-6 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeZone?.id === z.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            {z.name}
                                        </button>
                                    ))}
                                    <button onClick={createZone} className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-white text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50 hover:text-slate-700 whitespace-nowrap transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4"/> قسم جديد
                                    </button>
                                </div>
                                {activeZone && (
                                    <button onClick={createTable} className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors flex items-center gap-2 shrink-0">
                                        <Plus className="w-4 h-4"/> إضافة طاولة
                                    </button>
                                )}
                            </div>
                            
                            {(!activeZone || !activeZone.tables || activeZone.tables.length === 0) ? (
                                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-4xl border border-dashed border-slate-300 p-12 text-slate-400">
                                    <Utensils className="w-16 h-16 mb-4 opacity-50"/>
                                    <h3 className="text-xl font-bold text-slate-500 mb-2">لا يوجد طاولات في هذا القسم</h3>
                                    <p className="text-sm">قم بإضافة طاولات جديدة لتبدأ باستقبال الطلبات</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {activeZone.tables.map((table: any) => {
                                        const isActive = table.status === 'OCCUPIED';
                                        const hasPendingCall = table.waiterCalls && table.waiterCalls.length > 0;
                                        return (
                                            <div key={table.id} onClick={() => typeof openTableSession !== 'undefined' && openTableSession(table)} className={`relative flex flex-col rounded-4xl border cursor-pointer transition-all duration-300 overflow-hidden group ${isActive ? 'bg-orange-50 border-orange-200 shadow-md shadow-orange-500/10' : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'}`}>
                                                
                                                {hasPendingCall && (
                                                    <div className="absolute top-4 right-4 flex items-center justify-center bg-yellow-500 text-white rounded-full p-2 animate-bounce shadow-lg z-10">
                                                        <Bell className="w-5 h-5" />
                                                    </div>
                                                )}

                                                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                                                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1 ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Utensils className="w-7 h-7" />
                                                    </div>
                                                    <h3 className={`text-2xl font-black mb-1 ${isActive ? 'text-orange-600' : 'text-slate-800'}`}>{table.name}</h3>
                                                    <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {hasPendingCall ? 'استدعاء نادل' : (isActive ? 'مشغولة' : 'متاحة')}
                                                    </span>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex gap-2">
                                                    {isActive && (
                                                        <button 
                                                            onClick={(e) => closeTableSession(e, table)}
                                                            className="flex-1 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                                                        >
                                                            تحرير
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => printQR(e, table)}
                                                        className="flex-1 py-2 bg-white text-orange-500 text-xs font-bold rounded-xl border border-slate-200 hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <QrCode className="w-4 h-4"/> باركود
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredProducts.map((p: any) => (
                                <div key={p.id} onClick={() => typeof addToCart !== 'undefined' && addToCart(p)} className="group bg-white rounded-4xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 hover:-translate-y-1">
                                    <div className="aspect-4/3 bg-slate-50/50 relative overflow-hidden p-6 flex items-center justify-center border-b border-slate-100">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 transition-transform duration-500 group-hover:scale-110">
                                                <Grid className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-sm font-extrabold text-slate-800">
                                            {p.price} ر.س
                                        </div>
                                    </div>
                                    <div className="p-5 bg-white">
                                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight line-clamp-2">{p.name}</h3>
                                        <p className="text-slate-400 font-semibold text-xs mt-2 uppercase tracking-wide">{p.barcode || 'NO BARCODE'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR - CART (Light Minimalist) */}
            <div className="hidden xl:flex w-[440px] bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 shadow-[-10px_0_40px_rgba(0,0,0,0.03)] relative">
                
                {/* Cart Header */}
                <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100 shadow-sm">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 leading-none mb-1">الطلب الحالي</h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">#{typeof activeTable !== 'undefined' && activeTable ? activeTable.name : 'NEW ORDER'}</p>
                        </div>
                    </div>
                    <button onClick={() => setCart([])} className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-[1.25rem] border border-transparent hover:border-red-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                            <ShoppingCart className="w-20 h-20 mb-2" />
                            <p className="font-extrabold text-xl">السلة فارغة</p>
                        </div>
                    ) : (
                        cart.map((item: any, index: number) => (
                            <div key={item.id} className="flex gap-4 p-4 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                    {item.image ? (
                                        <img src={item.image} className="w-12 h-12 object-contain mix-blend-multiply" />
                                    ) : (
                                        <Grid className="w-6 h-6 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-3">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-2 pr-2 break-words text-wrap">{item.name}</h4>
                                        <span className="font-black text-orange-500 whitespace-nowrap bg-orange-50/50 border border-orange-100 px-2 py-1 rounded-lg text-sm">{item.price} ر.س</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white text-slate-600 shadow-sm flex items-center justify-center hover:text-orange-500 hover:border-orange-200 border border-slate-100 transition-colors">
                                                <Minus className="w-4 h-4 font-bold" />
                                            </button>
                                            <span className="w-8 text-center font-extrabold text-slate-800 text-sm">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-white text-slate-600 shadow-sm flex items-center justify-center hover:text-orange-500 hover:border-orange-200 border border-slate-100 transition-colors">
                                                <Plus className="w-4 h-4 font-bold" />
                                            </button>
                                        </div>
                                        <span className="font-black text-slate-800 text-lg">
                                            {(item.price * item.qty).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Section (Light Minimalist) */}
                <div className="p-8 bg-white border-t border-slate-200 flex flex-col gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                    
                    {/* Summary */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-slate-500 font-bold text-sm">
                            <span>المجموع الفرعي</span>
                            <span>{displaySubtotal.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-sm">
                            <span>الضريبة (15%)</span>
                            <span>{tax.toFixed(2)} ر.س</span>
                        </div>
                        <div className="h-px w-full bg-slate-100 my-2"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-black text-slate-800 mb-1">الإجمالي</span>
                            <span className="text-4xl font-black text-orange-500 tracking-tight">{finalTotal.toFixed(2)} <span className="text-lg font-bold">ر.س</span></span>
                        </div>
                    </div>

                    {/* Action Buttons - Solid Colors */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleCheckout('CARD')} disabled={cart.length === 0 || isProcessing} className="py-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(14,165,233,0.25)] active:scale-95 disabled:opacity-50">
                            <CreditCard className="w-5 h-5" /> MADA
                        </button>
                        <button onClick={() => handleCheckout('CASH')} disabled={cart.length === 0 || isProcessing} className="py-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50">
                            <Banknote className="w-5 h-5" /> {_t('نقد', 'CASH')}</button>
                        <button 
                            onClick={() => {
                                if (typeof setShowSplitModal !== 'undefined') setShowSplitModal(true);
                                else handleCheckout('CASH');
                            }}
                            disabled={cart.length === 0 || isProcessing}
                            className="py-4 col-span-2 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(30,41,59,0.25)] active:scale-95 disabled:opacity-50"
                        >
                            دفع وإصدار الفاتورة <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                        </button>
                    </div>

                </div>
            </div>

            {/* FLOATING CART BUTTON FOR MOBILE */}
            <div className="xl:hidden fixed bottom-6 left-6 z-30">
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 hover:bg-orange-600 transition-all border-4 border-white relative"
                >
                    <ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                            {cart.reduce((sum, item) => sum + item.qty, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* MOBILE CART OVERLAY DRAWER */}
            {isCartOpen && (
                <div className="xl:hidden fixed inset-0 bg-slate-900/50 z-40 flex justify-end animate-in fade-in duration-300" onClick={() => setIsCartOpen(false)}>
                    <div className="w-[400px] max-w-[90%] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[1rem] bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100 shadow-sm">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-800 leading-none mb-1">الطلب الحالي</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">#{typeof activeTable !== 'undefined' && activeTable ? activeTable.name : 'NEW ORDER'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCart([])} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                    <ShoppingCart className="w-16 h-16 mb-2" />
                                    <p className="font-extrabold text-lg">السلة فارغة</p>
                                </div>
                            ) : (
                                cart.map((item: any) => (
                                    <div key={item.id} className="flex gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                            {item.image ? (
                                                <img src={item.image} className="w-9 h-9 object-contain mix-blend-multiply" />
                                            ) : (
                                                <Grid className="w-5 h-5 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center gap-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 pr-2 break-words text-wrap">{item.name}</h4>
                                                <span className="font-extrabold text-orange-500 whitespace-nowrap bg-orange-50/50 border border-orange-100 px-2 py-0.5 rounded text-xs">{item.price} ر.س</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-white text-slate-600 shadow-sm flex items-center justify-center hover:text-orange-500 border border-slate-100 transition-colors">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-bold text-slate-800 text-xs">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-white text-slate-600 shadow-sm flex items-center justify-center hover:text-orange-500 border border-slate-100 transition-colors">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {(item.price * item.qty).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-white border-t border-slate-200 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-500 font-bold text-xs">
                                    <span>المجموع الفرعي</span>
                                    <span>{displaySubtotal.toFixed(2)} ر.س</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-bold text-xs">
                                    <span>الضريبة (15%)</span>
                                    <span>{tax.toFixed(2)} ر.س</span>
                                </div>
                                <div className="h-px w-full bg-slate-100 my-1"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-800 mb-1">الإجمالي</span>
                                    <span className="text-2xl font-black text-orange-500 tracking-tight">{finalTotal.toFixed(2)} <span className="text-sm font-bold">ر.س</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setIsCartOpen(false); handleCheckout('CARD'); }} disabled={cart.length === 0 || isProcessing} className="py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <CreditCard className="w-4 h-4" /> بطاقة (F2)
                                </button>
                                <button onClick={() => { setIsCartOpen(false); handleCheckout('CASH'); }} disabled={cart.length === 0 || isProcessing} className="py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <Banknote className="w-4 h-4" /> نقد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS INJECTED HERE (Using light minimalist style) */}
            {typeof showCustomerModal !== 'undefined' && showCustomerModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowCustomerModal(false)}>
                    <div className="bg-white border border-slate-200 rounded-4xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-extrabold text-xl flex items-center gap-3 text-slate-800">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><User className="text-orange-500 w-5 h-5"/></div> 
                                اختيار العميل
                            </h3>
                            <button onClick={() => setShowCustomerModal(false)} className="w-10 h-10 bg-white hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 shadow-sm"><XIcon size={20}/></button>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-6">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="البحث باسم العميل أو رقم الهاتف..." className="w-full py-4 pr-12 pl-4 bg-slate-50 border border-slate-200 focus:border-orange-500 outline-none focus:ring-4 focus:ring-orange-500/10 rounded-[1.25rem] font-bold text-slate-800 transition-all placeholder-slate-400" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto mb-6 space-y-3 custom-scrollbar pr-2">
                                {customers.filter((c: any) => c.name.includes(customerSearch) || (c.phone && c.phone.includes(customerSearch))).map((c: any) => (
                                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }} className="p-5 bg-white border border-slate-200 rounded-[1.25rem] hover:border-orange-300 hover:shadow-md cursor-pointer flex justify-between items-center font-bold transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors"><User className="w-5 h-5" /></div>
                                            <span className="text-slate-800 text-lg">{c.name}</span>
                                        </div>
                                        <span className="text-slate-500 font-semibold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{c.phone}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowAddCustomerModal(true)} className="w-full py-5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-[1.25rem] font-extrabold border border-orange-200 flex justify-center gap-2 transition-all">
                                <Plus className="w-6 h-6"/> إضافة عميل جديد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {typeof showSplitModal !== 'undefined' && showSplitModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowSplitModal(false)}>
                    <div className="bg-white border border-slate-200 rounded-4xl w-full max-w-sm overflow-hidden shadow-2xl p-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-[1.25rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-6 border border-orange-100">
                            <LayoutDashboard className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-2xl mb-2 text-center text-slate-800">تقسيم الدفع</h3>
                        <p className="text-center text-slate-500 text-sm mb-6 font-semibold">حدد المبلغ النقدي وسيتم حساب الباقي للشبكة</p>
                        
                        <div className="text-center text-4xl font-black text-orange-500 mb-8 drop-shadow-sm">
                            {finalTotal.toLocaleString()} <span className="text-xl">SAR</span>
                        </div>
                        
                        <div className="space-y-5 mb-8">
                            <div className="relative">
                                <label className="block text-xs font-extrabold text-slate-500 mb-2 uppercase tracking-widest absolute -top-2.5 right-4 bg-white px-2">{_t('المبلغ النقدي (نقد)', 'المبلغ النقدي (Cash)')}</label>
                                <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 rounded-[1.25rem] font-black text-2xl text-center text-slate-800 transition-all" value={splitCash} onChange={e => { const val = Number(e.target.value); setSplitCash(e.target.value); setSplitCard(val < finalTotal ? (finalTotal - val).toFixed(2) : '0'); }} />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-extrabold text-slate-500 mb-2 uppercase tracking-widest absolute -top-2.5 right-4 bg-white px-2">{_t('متبقي الشبكة (بطاقة)', 'متبقي الشبكة (Card)')}</label>
                                <input type="number" disabled className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[1.25rem] font-black text-2xl text-center text-slate-500" value={splitCard} />
                            </div>
                        </div>
                        <button onClick={() => { setShowSplitModal(false); handleCheckout('SPLIT'); }} disabled={((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01) || isProcessing} className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.25rem] font-black text-xl disabled:opacity-50 transition-all shadow-[0_8px_20px_rgba(249,115,22,0.3)]">
                            تأكيد الدفع المشترك
                        </button>
                    </div>
                </div>
            )}
        
            {showAddCustomerModal && (
                <AddCustomerModal 
                    onClose={() => setShowAddCustomerModal(false)} 
                    onSuccess={(newCustomer) => {
                        setShowAddCustomerModal(false);
                        setSelectedCustomer(newCustomer);
                        setShowCustomerModal(false);
                    }}
                />
            )}
        </div>
    );
}