'use client';

import { useState, useEffect, useRef } from 'react';
import PosReturnsModal from '@/components/PosReturnsModal';
import Link from 'next/link';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import VoucherReceipt from '../../../components/VoucherReceipt';
import { QRCodeCanvas } from 'qrcode.react';
import { RiyalLogo } from '@/components/RiyalLogo';
import { useTranslation } from "@/lib/i18n";
import { useSettings } from '@/lib/SettingsContext';

interface Product {
    id: number; name: string; barcode: string; sellPrice: number;
    currentStock: number; taxRate: number; unit?: { name: string };
}
interface CartItem {
    productId: number; productName: string; quantity: number;
    price: number; discountRate: number; discountValue?: number; taxRate: number;
    stock: number; unitName: string;
}
interface Customer { id: number; name: string; phone?: string; taxNumber?: string | null; crNo?: string | null; address?: string | null; }
interface HeldInvoice { id: string; cart: CartItem[]; customerId: string; notes: string; discountRate: number; paidAmount: string; paymentType: string; heldAt: string; label: string; }

export default function SalesPage() {
    const { t } = useTranslation();
    const { getSetting } = useSettings();
    const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';
    const taxEnabled = getSetting('POS_TAX_ENABLED', 'true') === 'true';
    const couponsEnabled = getSetting('POS_COUPONS_ENABLED', 'true') === 'true';
    const allowNegativeStock = getSetting('POS_ALLOW_NEGATIVE_STOCK', 'false') === 'true';
    const allowAddProduct = getSetting('POS_ALLOW_ADD_PRODUCT', 'true') === 'true';
    const rulesRaw = getSetting('POS_DISCOUNT_RULES', '[]');
    const [discountRules, setDiscountRules] = useState<{minAmount: number, maxDiscount: number, maxDiscountPercent?: number}[]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(rulesRaw);
            if(Array.isArray(parsed)) setDiscountRules(parsed);
        } catch(e) {}
    }, [rulesRaw]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [taxRate, setTaxRate] = useState(15);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [stockId, setStockId] = useState('1');
    const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; code: string; exchangeRate: number; isDefault: boolean; isActive: boolean }[]>([]);
    const [currencyId, setCurrencyId] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1.0);
    const [paymentType, setPaymentType] = useState('card');
    const [splitCash, setSplitCash] = useState('');
    const [splitCard, setSplitCard] = useState('');
    const [manualInvoiceNo, setManualInvoiceNo] = useState('');
    const [manualDate, setManualDate] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [posPort, setPosPort] = useState<any>(null);
    const [posStatus, setPosStatus] = useState<'disconnected' | 'connected' | 'sending'>('disconnected');
    const [retryPosAmount, setRetryPosAmount] = useState<number | null>(null);
    const [retryInvoiceNo, setRetryInvoiceNo] = useState<string>('');
    const [discountRate, setDiscountRate] = useState(0);
    const [discountValueState, setDiscountValueState] = useState(0);
    const [notes, setNotes] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [showVoucher, setShowVoucher] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedVoucherData, setSelectedVoucherData] = useState<any>(null);






























    const [lastInvoiceData, setLastInvoiceData] = useState<{
        invoiceId: number; invoiceNumber: string; date: string; customerName: string;
        customerTaxNo?: string | null; customerCrNo?: string | null; customerAddress?: string | null;
        paymentMethod: string; items: { name: string; quantity: number; price: number; total: number }[];
        subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number;
    } | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const discountRef = useRef<HTMLInputElement>(null);
    const [focusedProductIndex, setFocusedProductIndex] = useState(-1);
    const [showTypeahead, setShowTypeahead] = useState(false);
    const [showReturnsModal, setShowReturnsModal] = useState(false);

    // BNPL (Tabby/Tamara) Polling State
    const [bnplProvider, setBnplProvider] = useState<'TABBY' | 'TAMARA' | null>(null);
    const [bnplUrl, setBnplUrl] = useState('');
    const [bnplOrderId, setBnplOrderId] = useState('');
    const [bnplPolling, setBnplPolling] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Dynamic Watcher for BNPL Status
    const initSettings = async () => { try { const res = await fetch('/api/settings'); if (res.ok) { const data = await res.json(); if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0); } } catch (e) {} }; useEffect(() => { initSettings(); }, []);
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (bnplPolling && bnplOrderId && bnplProvider) {
            interval = setInterval(async () => {
                try {
                    setCheckingStatus(true);
                    const res = await fetch(`/api/pos/bnpl/status?provider=${bnplProvider.toLowerCase()}&sessionId=${bnplOrderId}`);
                    const data = await res.json();
                    
                    if (data.isSuccess) {
                        clearInterval(interval);
                        setBnplPolling(false);
                        // Trigger final save using the manual override trick
                        document.getElementById('bnpl-force-save')?.click();
                    } else if (data.status === 'REJECTED' || data.status === 'EXPIRED' || data.status === 'DECLINED') {
                        clearInterval(interval);
                        setBnplPolling(false);
                        alert(t('sys.str_807'));
                        setBnplProvider(null); setBnplUrl(''); setBnplOrderId('');
                    }
                } catch (e) {
                    console.error('Polling Error', e);
                } finally {
                    setCheckingStatus(false);
                }
            }, 3000); 
        }
        return () => { if (interval) clearInterval(interval); };
    }, [bnplPolling, bnplOrderId, bnplProvider]);

    // Coupon logic
    const [couponCode, setCouponCode] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

    // Quick Add Customer
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCust, setNewCust] = useState({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '', type: '0' });
    const [savingCust, setSavingCust] = useState(false);

    // Held Invoices
    const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
    const [showHeldPanel, setShowHeldPanel] = useState(false);

    // Quick Add Product
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProd, setNewProd] = useState({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
    const [savingProd, setSavingProd] = useState(false);

    // Invoice History
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notes, setNotes] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [showVoucher, setShowVoucher] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedVoucherData, setSelectedVoucherData] = useState<any>(null);































    const [lastInvoiceData, setLastInvoiceData] = useState<{
        invoiceId: number; invoiceNumber: string; date: string; customerName: string;
        customerTaxNo?: string | null; customerCrNo?: string | null; customerAddress?: string | null;
        paymentMethod: string; items: { name: string; quantity: number; price: number; total: number }[];
        subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number;
    } | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const discountRef = useRef<HTMLInputElement>(null);
    const [focusedProductIndex, setFocusedProductIndex] = useState(-1);
    const [showTypeahead, setShowTypeahead] = useState(false);
    const [showReturnsModal, setShowReturnsModal] = useState(false);

    // BNPL (Tabby/Tamara) Polling State
    const [bnplProvider, setBnplProvider] = useState<'TABBY' | 'TAMARA' | null>(null);
    const [bnplUrl, setBnplUrl] = useState('');
    const [bnplOrderId, setBnplOrderId] = useState('');
    const [bnplPolling, setBnplPolling] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Dynamic Watcher for BNPL Status
    const initSettings = async () => { try { const res = await fetch('/api/settings'); if (res.ok) { const data = await res.json(); if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0); } } catch (e) {} }; useEffect(() => { initSettings(); }, []);
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (bnplPolling && bnplOrderId && bnplProvider) {
            interval = setInterval(async () => {
                try {
                    setCheckingStatus(true);
                    const res = await fetch(`/api/pos/bnpl/status?provider=${bnplProvider.toLowerCase()}&sessionId=${bnplOrderId}`);
                    const data = await res.json();
                    
                    if (data.isSuccess) {
                        clearInterval(interval);
                        setBnplPolling(false);
                        // Trigger final save using the manual override trick
                        document.getElementById('bnpl-force-save')?.click();
                    } else if (data.status === 'REJECTED' || data.status === 'EXPIRED' || data.status === 'DECLINED') {
                        clearInterval(interval);
                        setBnplPolling(false);
                        alert(t('sys.str_807'));
                        setBnplProvider(null); setBnplUrl(''); setBnplOrderId('');
                    }
                } catch (e) {
                    console.error('Polling Error', e);
                } finally {
                    setCheckingStatus(false);
                }
            }, 3000); 
        }
        return () => { if (interval) clearInterval(interval); };
    }, [bnplPolling, bnplOrderId, bnplProvider]);

    // Coupon logic
    const [couponCode, setCouponCode] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

    // Quick Add Customer
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCust, setNewCust] = useState({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '', type: '0' });
    const [savingCust, setSavingCust] = useState(false);

    // Held Invoices
    const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
    const [showHeldPanel, setShowHeldPanel] = useState(false);

    // Quick Add Product
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProd, setNewProd] = useState({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
    const [savingProd, setSavingProd] = useState(false);

    // Invoice History
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [historyInvoices, setHistoryInvoices] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Void Mode
    const [voidMode, setVoidMode] = useState(false);

    // Tax Inclusive Mode
    const [isTaxInclusive, setIsTaxInclusive] = useState(true);

    // Permission-based delete
    const [canDelete, setCanDelete] = useState(false);

    // Auto-detect POS terminal
    const detectPosTerminal = async () => {
        if (!('serial' in navigator)) { console.warn('WebSerial not supported'); return; }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ports = await (navigator as any).serial.getPorts();
            if (ports.length > 0) {
                const port = ports[0];
                if (!port.readable) {
                    await port.open({ baudRate: 9600 });
                }
                setPosPort(port);
                setPosStatus('connected');
                console.log('✅ POS terminal detected');
            }
        } catch (e) { console.warn('POS detect:', e); }
    };

    const connectPosManual = async () => {
        if (!('serial' in navigator)) { showToast(t('sys.str_808')); return; }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 });
            setPosPort(port);
            setPosStatus('connected');
            showToast(t('sys.str_809'));
        } catch (e) { console.warn('POS connect:', e); showToast(t('sys.str_810')); }
    };

    const sendToPos = async (amount: number): Promise<'approved' | 'declined' | 'error' | 'no_device'> => {
        if (!posPort || !posPort.writable) {
            console.warn('POS not connected, skipping');
            return 'no_device';
        }
        try {
            setPosStatus('sending');
            const writer = posPort.writable.getWriter();
            // Standard POS terminal payment command (amount in halalas)
            const amountHalalas = Math.round(amount * 100);
            const cmd = `\x02P${amountHalalas.toString().padStart(12, '0')}\x03`;
            await writer.write(new TextEncoder().encode(cmd));
            writer.releaseLock();

            // Wait for response from POS terminal (up to 60 seconds)
            if (posPort.readable) {
                const reader = posPort.readable.getReader();
                let response = '';
                const timeout = setTimeout(() => { try { reader.cancel(); } catch { } }, 60000);

                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        response += new TextDecoder().decode(value);
                        // Check for end-of-message marker (ETX = \x03)
                        if (response.includes('\x03')) break;
                    }
                } catch (e) {
                    console.warn('POS read timeout or error:', e);
                } finally {
                    clearTimeout(timeout);
                    reader.releaseLock();
                }

                console.log('POS Response:', response);
                setPosStatus('connected');

                // Parse response: look for approval code
                // Most terminals: A = Approved, D = Declined
                if (response.includes('A') || response.includes('APPROVED') || response.includes('00')) {
                    return 'approved';
                } else if (response.includes('D') || response.includes('DECLINED') || response.includes('05')) {
                    return 'declined';
                }
                // If we got any response, assume approved (terminal-specific)
                return response.length > 0 ? 'approved' : 'error';
            }
            setPosStatus('connected');
            return 'approved';
        } catch (e) {
            console.error('POS send error:', e);
            setPosStatus('connected');
            return 'error';
        }
    };

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); setWarehouses(Array.isArray(d) ? d : []); }
        } catch (err) { console.error('Error fetching warehouses:', err); }
    };

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        fetchWarehouses();
        const fetchCurrencies = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/settings/currencies', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const c = await res.json();
                setCurrencies(c);
                const def = c.find((x: any) => x.isDefault);
                if (def) {
                    setCurrencyId(def.id.toString());
                    setExchangeRate(def.exchangeRate);
                }
            }
        };
        fetchCurrencies();
        searchRef.current?.focus();
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            setIsAdmin(u.role === 'admin');
            const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
            setCanDelete(u.role === 'admin' || perms.includes('delete_invoices'));
        } catch { }
        detectPosTerminal();
        // Load held invoices from localStorage
        try { const held = JSON.parse(localStorage.getItem('heldInvoices') || '[]'); setHeldInvoices(held); } catch { }
    }, []);

    // Global POS Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['F1', 'F2', 'F3', 'F4', 'F8', 'F9', 'F12', 'Escape'].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === 'F1') {
                searchRef.current?.focus();
            } else if (e.key === 'F8') {
                const qtyInputs = document.querySelectorAll('.qty-input');
                if (qtyInputs.length > 0) (qtyInputs[qtyInputs.length - 1] as HTMLInputElement).select();
            } else if (e.key === 'F9') {
                document.getElementById('history-btn')?.click();
            } else if (e.key === 'F4') {
                document.getElementById('recall-btn')?.click();
            } else if (e.key === 'F2') {
                document.getElementById('save-btn')?.click();
            } else if (e.key === 'F3') {
                document.getElementById('hold-btn')?.click();
            } else if (e.key === 'Escape') {
                setSearch('');
                setShowTypeahead(false);
                setShowAddCustomer(false);
                setShowAddProduct(false);
                setShowHistory(false);
                setShowHeldPanel(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const saveNewCustomer = async () => {
        if (!newCust.name.trim()) return;
        setSavingCust(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newCust),
            });
            if (res.ok) {
                const created = await res.json();
                await fetchCustomers();
                setCustomerId(created.id.toString());
                setShowAddCustomer(false);
                setNewCust({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '', type: '0' });
            } else {
                alert(t('sys.str_811'));
            }
        } catch { alert(t('sys.str_419')); }
        finally { setSavingCust(false); }
    };

    const openAddProduct = () => {
        setNewProd({ name: '', barcode: search || '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
        setShowAddProduct(true);
    };

    const saveNewProduct = async () => {
        if (!newProd.name.trim()) return;
        setSavingProd(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newProd),
            });
            if (res.ok) {
                const created = await res.json();
                await fetchProducts();
                addToCart({ id: created.id, name: created.name, barcode: created.barcode, sellPrice: created.sellPrice, currentStock: created.currentStock, taxRate: created.taxRate, unit: undefined });
                setShowAddProduct(false);
                setNewProd({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
            } else {
                alert(t('sys.str_812'));
            }
        } catch { alert(t('sys.str_419')); }
        finally { setSavingProd(false); }
    };

    async function fetchProducts() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); const arr = Array.isArray(data) ? data : []; setProducts(arr); setFilteredProducts(arr.slice(0, 20)); }
        } catch (err) { console.error(err); }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); setCustomers(Array.isArray(d) ? d : []); }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (!search) { setFilteredProducts(products.slice(0, 20)); return; }
        const s = search.toLowerCase();
        setFilteredProducts(products.filter(p =>
            p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s))
        ).slice(0, 20));
    }, [search, products]);

    const addToCart = (p: Product) => {
        if (!allowNegativeStock && p.currentStock <= 0) {
            showToast('الكمية نافذة ولا يمكن البيع بالسالب حسب الإعدادات');
            return;
        }
        const existing = cart.find(c => c.productId === p.id);
        if (existing) {
            if (!allowNegativeStock && existing.quantity + 1 > p.currentStock) {
                showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
                return;
            }
            // Update quantity AND move item to the top
            setCart([
                { ...existing, quantity: existing.quantity + 1 },
                ...cart.filter(c => c.productId !== p.id)
            ]);
        } else {
            setCart([{
                productId: p.id, productName: p.name, quantity: 1,
                price: p.sellPrice, discountRate: 0, taxRate: p.taxRate || 15,
                discountValue: 0, stock: p.currentStock, unitName: p.unit?.name || t('sys.str_813'),
            }, ...cart]);
        }
        setSearch('');
        searchRef.current?.focus();
    };

    const updateCartItem = (idx: number, field: string, value: number) => {
        if (!allowNegativeStock && field === 'quantity') {
            const item = cart[idx];
            if (value > item.stock) {
                 showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
                 return;
            }
        }
        setCart(cart.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const removeCartItem = (idx: number) => {
        setCart(cart.filter((_, i) => i !== idx));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => {
        let actualPrice = item.price;
        if (isTaxInclusive && taxEnabled) {
             actualPrice = actualPrice / (1 + (taxRate / 100));
        }
        const itemTotal = item.quantity * actualPrice;
        const disc = itemTotal * (item.discountRate / 100) + (item.discountValue || 0);
        return sum + Math.max(0, itemTotal - disc);
    }, 0);
    const maxAllowedDiscount = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return Infinity;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscount));
    })();
    const maxAllowedDiscountPercent = (() => {
        if (!discountEnabled) return 0;
        if (discountRules.length === 0) return 100;
        const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.maxDiscountPercent || 0));
    })();
    const regularDiscountValue = subtotal * (discountRate / 100) + discountValueState;
    let afterDiscount = subtotal - regularDiscountValue;

    let couponDiscountValue = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            couponDiscountValue = afterDiscount * (appliedCoupon.value / 100);
        } else {
            couponDiscountValue = appliedCoupon.value;
            if (couponDiscountValue > afterDiscount) couponDiscountValue = afterDiscount;
        }
    }
    afterDiscount = afterDiscount - couponDiscountValue;

    const actualTaxRate = taxEnabled ? taxRate : 0;
                        {/* Cart Table */}
                        {voidMode && <div style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid var(--danger)', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', textAlign: 'center', fontWeight: '700', color: 'var(--danger)', fontSize: '13px', animation: 'pulse 1.5s infinite' }}>{t('sys.str_765')}</div>}
                        <div className="pos-invoice-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('sys.str_63')}</th>
                                        <th style={{ width: '80px' }}>{t('sys.str_64')}</th>
                                        <th style={{ width: '100px' }}>{t('sys.str_65')}</th>
                                        
                                        <th style={{ width: '100px' }}>{t('sys.str_66')}</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className="empty-state" style={{ padding: '40px' }}>
                                                    <div className="empty-state-icon">🧾</div>
                                                    <div className="empty-state-text">{t('purchases.str_981')}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : cart.map((item, idx) => {
                                        const itemSub = item.quantity * item.price;
                                        const itemDisc = itemSub * (item.discountRate / 100) + (item.discountValue || 0);
                                        const itemTotal = Math.max(0, itemSub - itemDisc);
                                        return (
                                            <tr key={idx} onClick={() => voidMode && removeCartItem(idx)}
                                                style={{ cursor: voidMode ? 'pointer' : undefined, background: voidMode ? 'rgba(239,68,68,0.05)' : undefined, transition: 'all 0.2s' }}>
                                                <td>
                                                    <div style={{ fontWeight: '600', fontSize: '13px', color: voidMode ? 'var(--danger)' : undefined }}>
                                                        {voidMode && '❌ '}{item.productName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input className="input qty-input" type="number" min="0.01" step="0.01"
                                                        value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>
                                                <td>
                                                    <span style={{ display: 'block', textAlign: 'center', padding: '6px 8px', fontWeight: '600', color: 'var(--text-primary)' }} dir="ltr">{fmt(item.price)}</span>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{fmt(itemTotal)}</td>
                                                <td>
                                                    <button onClick={() => removeCartItem(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>


                        {/* Totals & Actions */}
                        <div className="pos-invoice-footer">
                            <div className="pos-totals">
                                <div className="pos-total-row">
                                    <span>{t('sys.str_768')}</span>
                                    <span>{fmt(subtotal)} {t('sys.str_68')}</span>
                                </div>
                                {discountEnabled && (
                                    <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span>{t('sys.str_769')}</span>
                                        <input className="input" type="number" min="0" step="0.01"
                                            id="discount-input"
                                            value={discountRate} onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (discountRules.length > 0 && val > maxAllowedDiscountPercent) {
                                                    showToast(`❌ عذراً، أقصى نسبة خصم مسموحة هي ${maxAllowedDiscountPercent}%`);
                                                    return;
                                                }
                                                setDiscountRate(val);
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(`✅ تم تطبيق خصم ${discountRate}%`); } }}
                                            style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                        <input className="input" type="number" min="0" step="0.01"
                                            placeholder="خصم بالريال"
                                            value={discountValueState} 
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (discountRules.length > 0 && val > maxAllowedDiscount) {
                                                    showToast(`❌ عذراً، أقصى خصم بالريال مسموح لهذه الفاتورة هو ${maxAllowedDiscount} ريال`);
                                                    return;
                                                }
                                                setDiscountValueState(val);
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(`✅ تم تطبيق خصم ${discountValueState} ر.س`); } }}
                                            style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>
                                        <button onClick={() => { if (discountRate > 0) { showToast(`✅ تم تطبيق خصم ${discountRate}% = ${fmt(regularDiscountValue)} ر.س`); } }}
                                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: discountRate > 0 ? 'var(--primary)' : 'var(--bg-card-hover)', color: discountRate > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                            {t('sys.str_770')}</button>
                                        {(discountRate > 0 || discountValueState > 0) && (
                                            <button onClick={() => { setDiscountRate(0); setDiscountValueState(0); showToast(t('sys.str_847')); }}
                                                style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                {t('sys.str_771')}</button>
                                        )}
                                        <span style={{ marginRight: 'auto', fontWeight: '600', color: discountRate > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                            {(discountRate > 0 || discountValueState > 0) ? `- ${fmt(regularDiscountValue)}` : '0.00'} {t('sys.str_68')}</span>
                                    </div>
                                )}
                                {couponsEnabled && (
                                    <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        <span>{t('sys.str_772')}</span>
                                        <input className="input" type="text"
                                            value={couponCode} onChange={e => setCouponCode(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                                            placeholder={t('sys.str_848')}
                                            style={{ width: '100px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', textTransform: 'uppercase' }} dir="ltr" disabled={!!appliedCoupon} />
                                        
                                        {!appliedCoupon ? (
                                            <button onClick={applyCoupon} disabled={couponApplying || !couponCode}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: couponCode ? 'var(--primary)' : 'var(--bg-card-hover)', color: couponCode ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                                {couponApplying ? '⏳' : t('sys.str_849')}
                                            </button>
                                        ) : (
                                            <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); showToast(t('sys.str_850')); }}
                                                style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                {t('sys.str_771')}</button>
                                        )}
                                        <span style={{ marginRight: 'auto', fontWeight: '600', color: appliedCoupon ? '#ef4444' : 'var(--text-muted)' }}>
                                            {appliedCoupon ? `- ${fmt(couponDiscountValue)}` : '0.00'} {t('sys.str_68')}</span>
                                    </div>
                                )}
                                {taxEnabled && (
                                <div className="pos-total-row">
                                    <span>{t('sys.str_773')}</span>
                                    <span>{fmt(taxValue)} {t('sys.str_68')}</span>
                                </div>
                                )}
                                <div className="pos-total-row grand">
                                    <span>{t('sys.str_66')}</span>
                                    <span style={{ color: 'var(--primary-light)' }}>{fmt(total)} {t('sys.str_68')}</span>
                                </div>
                                {(paymentType === 'cash' || paymentType === 'credit' || paymentType === 'installment') && (
                                    <>
                                        <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{t('sys.str_774')}</span>
                                            <input className="input" type="number" min="0" step="0.01"
                                                value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                                                placeholder={fmt(total)} style={{ width: '120px', textAlign: 'center', padding: '4px 8px' }} dir="ltr" />
                                        </div>
                                        {paymentType === 'cash' && paidAmount && parseFloat(paidAmount) > total && (
                                            <div className="pos-total-row" style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '6px', padding: '8px' }}>
                                                <span style={{ fontWeight: '700', color: '#22c55e' }}>{t('sys.str_775')}</span>
                                                <span style={{ fontWeight: '700', fontSize: '18px', color: '#22c55e', fontFamily: 'monospace' }}>{fmt(parseFloat(paidAmount) - total)} {t('sys.str_68')}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {paymentType === 'split' && (
                                    <>
                                        <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{t('sys.str_776')}</span>
                                            <input className="input" type="number" min="0" step="0.01"
                                                value={splitCash} onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setSplitCash(e.target.value);
                                                    if (val < total) {
                                                        setSplitCard((total - val).toFixed(2));
                                                    } else {
                                                        setSplitCard('0');
                                                    }
                                                }}
                                                style={{ width: '120px', textAlign: 'center', padding: '4px 8px' }} dir="ltr" />
                                        </div>
                                        <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{t('sys.str_777')}</span>
                                            <input className="input" type="number" min="0" step="0.01" disabled
                                                value={splitCard} 
                                                style={{ width: '120px', textAlign: 'center', padding: '4px 8px', background: '#f1f5f9', cursor: 'not-allowed' }} dir="ltr" />
                                        </div>
                                        {((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) < total && (
                                            <div className="pos-total-row" style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 'bold' }}>
                                                {t('sys.str_778')}</div>
                                        )}
                                        {((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) > total && (
                                            <div className="pos-total-row" style={{ color: '#22c55e', fontSize: '13px', fontWeight: 'bold' }}>
                                                {t('sys.str_779')}{fmt(((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) - total)} {t('sys.str_68')}</div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pos-actions">
                                {retryPosAmount ? (
                                    <>
                                        <button className="btn" onClick={retryPosPayment} disabled={saving}
                                            style={{ background: '#f59e0b', color: '#fff', fontWeight: '700', flex: 1, animation: 'pulse 1.5s infinite' }}>
                                            {saving ? t('sys.str_851') : `🔄 إعادة إرسال ${fmt(retryPosAmount)} لمدى`}
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => { setRetryPosAmount(null); setRetryInvoiceNo(''); }}>{t('sys.str_780')}</button>
                                    </>
                                ) : (
                                    <>
                                        <button id="save-btn" className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving || cart.length === 0} style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                                            {saving ? t('sys.str_852') : t('sys.str_455')} <kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>F2</kbd>
                                        </button>
                                        <button className="btn btn-success" onClick={() => handleSave(true)} disabled={saving || cart.length === 0}>
                                            {t('sys.str_781')}</button>
                                        <button className="btn" onClick={() => handleSave(false, true)} disabled={saving || cart.length === 0}
                                            style={{ background: '#25D366', color: '#fff', fontWeight: '600' }}>
                                            {t('sys.str_782')}</button>
                                        <button className="btn btn-ghost" onClick={handleNewInvoice}>{t('sys.str_742')}</button>
                                    </>
                                )}
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder={t('sys.str_4336')} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>
                        {toast}
                    </div>
                </div>
            )}

            {showReceipt && lastInvoiceData && (
                <InvoiceReceipt
                    invoiceId={lastInvoiceData.invoiceId}
                    invoiceData={lastInvoiceData}
                    autoPrint={true}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {/* Quick Add Customer Modal */}
            {showAddCustomer && (
                <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_783')}</h3>
                            <button className="modal-close" onClick={() => setShowAddCustomer(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder={t('sys.str_854')} value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} autoFocus />
                            <input className="input" placeholder={t('sys.str_855')} value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} dir="ltr" />
                            <input className="input" placeholder={t('sys.str_529')} value={newCust.taxNumber} onChange={e => setNewCust({ ...newCust, taxNumber: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder={t('sys.str_537')} value={newCust.street} onChange={e => setNewCust({ ...newCust, street: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_538')} value={newCust.buildingNumber} onChange={e => setNewCust({ ...newCust, buildingNumber: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder={t('sys.str_536')} value={newCust.district} onChange={e => setNewCust({ ...newCust, district: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_528')} value={newCust.city} onChange={e => setNewCust({ ...newCust, city: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_539')} value={newCust.postalCode} onChange={e => setNewCust({ ...newCust, postalCode: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" type="number" placeholder={t('sys.str_540')} value={newCust.creditLimit} onChange={e => setNewCust({ ...newCust, creditLimit: e.target.value })} dir="ltr" />
                                <select className="input" value={newCust.type} onChange={e => setNewCust({ ...newCust, type: e.target.value })}>
                                    <option value="0">{t('sys.str_532')}</option>
                                    <option value="1">{t('sys.str_533')}</option>
                                    <option value="2">{t('sys.str_784')}</option>
                                </select>
                            </div>
                            <input className="input" placeholder={t('sys.str_465')} value={newCust.notes} onChange={e => setNewCust({ ...newCust, notes: e.target.value })} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddCustomer(false)}>{t('fin.str_206')}</button>
                            <button className="btn btn-primary" onClick={saveNewCustomer} disabled={savingCust || !newCust.name.trim()}>
                                {savingCust ? t('sys.str_852') : t('sys.str_455')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Product Modal */}
            {showAddProduct && (
                <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_764')}</h3>
                            <button className="modal-close" onClick={() => setShowAddProduct(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder={t('sys.str_856')} value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} autoFocus />
                            <input className="input" placeholder={t('sys.str_857')} value={newProd.barcode} onChange={e => setNewProd({ ...newProd, barcode: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_785')}</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.buyPrice} onChange={e => setNewProd({ ...newProd, buyPrice: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_786')}</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.sellPrice} onChange={e => setNewProd({ ...newProd, sellPrice: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_787')}</label>
                                    <input className="input" type="number" placeholder="15" value={newProd.taxRate} onChange={e => setNewProd({ ...newProd, taxRate: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_788')}</label>
                                    <input className="input" type="number" placeholder="0" value={newProd.currentStock} onChange={e => setNewProd({ ...newProd, currentStock: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddProduct(false)}>{t('fin.str_206')}</button>
                            <button className="btn btn-primary" onClick={saveNewProduct} disabled={savingProd || !newProd.name.trim() || !newProd.sellPrice}>
                                {savingProd ? t('sys.str_852') : t('purchases.str_1040')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Held Invoices Panel */}
            {showHeldPanel && (
                <div className="modal-overlay" onClick={() => setShowHeldPanel(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_4323')}{heldInvoices.length})</h3>
                            <button className="modal-close" onClick={() => setShowHeldPanel(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {heldInvoices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                    <div>{t('sys.str_4324')}</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {heldInvoices.map(held => {
                                        const heldTotal = held.cart.reduce((s, item) => {
                                            const t = item.quantity * item.price;
                                            return s + (t - t * (item.discountRate / 100));
                                        }, 0);
                                        const heldWithTax = heldTotal + (heldTotal * (taxRate / 100));
                                        return (
                                            <div key={held.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>⏸️ {held.label}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {held.cart.map(c => c.productName).join(t('sys.str_859')).substring(0, 60)}{held.cart.map(c => c.productName).join(t('sys.str_859')).length > 60 ? '...' : ''}
                                                    </div>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '4px' }}>
                                                        {t('sys.str_71')}{fmt(heldWithTax)} {t('sys.str_68')}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}
                                                        onClick={() => recallInvoice(held.id)}>{t('sys.str_744')}</button>
                                                    <button className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--danger)' }}
                                                        onClick={() => deleteHeldInvoice(held.id)}>🗑️</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice History Modal */}
            {showHistory && !selectedInvoice && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_4325')}</h3>
                            <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ overflow: 'auto', flex: 1 }}>
                            {historyLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_792')}</div>
                            ) : historyInvoices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                    <div>{t('sys.str_4326')}</div>
                                </div>
                            ) : (
                                <table className="table" style={{ fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{t('fin.str_232')}</th>
                                            <th>{t('sys.str_794')}</th>
                                            <th>{t('sys.str_460')}</th>
                                            <th>{t('sys.str_795')}</th>
                                            <th>{t('sys.str_66')}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyInvoices.map((inv: any) => (
                                            <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                                <td>{new Date(inv.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{inv.customer?.name || t('sys.str_752')}</td>
                                                <td>{inv.paymentType === 'cash' ? '💵' : inv.paymentType === 'card' ? '💳' : inv.paymentType === 'transfer' ? '🏦' : '📝'}</td>
                                                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{fmt(inv.total)} {t('sys.str_68')}</td>
                                                <td><span style={{ fontSize: '16px' }}>◀</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3>{t('sys.str_4327')}{selectedInvoice.invoiceNo}</h3>
                            <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '13px' }}>
                                <div><strong>{t('sys.str_797')}</strong> {new Date(selectedInvoice.date).toLocaleDateString('ar-SA')}</div>
                                <div><strong>{t('sys.str_798')}</strong> {new Date(selectedInvoice.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div><strong>{t('sys.str_799')}</strong> {selectedInvoice.customer?.name || t('sys.str_752')}</div>
                                <div><strong>{t('sys.str_800')}</strong> {selectedInvoice.paymentType === 'cash' ? t('sys.str_860') : selectedInvoice.paymentType === 'card' ? t('sys.str_861') : selectedInvoice.paymentType === 'transfer' ? t('sys.str_862') : t('sys.str_863')}</div>
                            </div>
                            <table className="table" style={{ fontSize: '13px', marginBottom: '16px' }}>
                                <thead><tr><th>{t('sys.str_801')}</th><th>{t('sys.str_64')}</th><th>{t('sys.str_65')}</th><th>{t('sys.str_66')}</th></tr></thead>
                                <tbody>
                                    {(selectedInvoice.details || []).map((d: { id: number; productName: string; quantity: number; price: number; total: number }, i: number) => (
                                        <tr key={d.id || i}>
                                            <td>{d.productName}</td>
                                            <td>{d.quantity}</td>
                                            <td>{fmt(d.price)}</td>
                                            <td style={{ fontWeight: '600' }}>{fmt(d.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ background: 'var(--bg-card-hover)', borderRadius: '10px', padding: '14px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>{t('sys.str_768')}</span><span>{fmt(selectedInvoice.subtotal)} {t('sys.str_68')}</span></div>
                                {selectedInvoice.discountValue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger)' }}><span>{t('sys.str_494')}</span><span>-{fmt(selectedInvoice.discountValue)} {t('sys.str_68')}</span></div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>{t('sys.str_802')}</span><span>{fmt(selectedInvoice.taxValue)} {t('sys.str_68')}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', borderTop: '1px solid var(--border)', paddingTop: '8px', color: 'var(--primary)' }}><span>{t('sys.str_66')}</span><span>{fmt(selectedInvoice.total)} {t('sys.str_68')}</span></div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => reprintInvoice(selectedInvoice)}>{t('sys.str_4328')}</button>
                            <button className="btn btn-primary" onClick={() => printVoucher(selectedInvoice)} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>{t('sys.str_804')}</button>
                            <button className="btn btn-success" onClick={() => sendWhatsApp(selectedInvoice)} style={{ background: '#25D366' }}>{t('sys.str_805')}</button>
                            {canDelete && <button className="btn" onClick={() => deleteInvoice(selectedInvoice)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_806')}</button>}
                            <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>{t('sys.str_77')}</button>
                        </div>
                    </div>
                </div>
            )}
            
            <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />

            {/* Receipt Modal */}
            {showReceipt && lastInvoiceData && (
                <InvoiceReceipt
                    invoiceData={lastInvoiceData}
                    autoPrint={true}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {/* Voucher Modal */}
            {showVoucher && selectedVoucherData && (
                <VoucherReceipt
                    voucherData={selectedVoucherData}
                    autoPrint={true}
                    onClose={() => setShowVoucher(false)}
                />
            )}
        </>

    );
}
