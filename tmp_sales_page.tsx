'use client';

import { useState, useEffect, useRef } from 'react';
import InvoiceReceipt from '@/components/InvoiceReceipt';

interface Product {
    id: number; name: string; barcode: string; sellPrice: number;
    currentStock: number; taxRate: number; unit?: { name: string };
}
interface CartItem {
    productId: number; productName: string; quantity: number;
    price: number; discountRate: number; taxRate: number;
    stock: number; unitName: string;
}
interface Customer { id: number; name: string; }
interface HeldInvoice { id: string; cart: CartItem[]; customerId: string; notes: string; discountRate: number; paidAmount: string; paymentType: string; heldAt: string; label: string; }

export default function SalesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [paymentType, setPaymentType] = useState('card');
    const [isAdmin, setIsAdmin] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [posPort, setPosPort] = useState<any>(null);
    const [posStatus, setPosStatus] = useState<'disconnected' | 'connected' | 'sending'>('disconnected');
    const [retryPosAmount, setRetryPosAmount] = useState<number | null>(null);
    const [retryInvoiceNo, setRetryInvoiceNo] = useState<string>('');
    const [discountRate, setDiscountRate] = useState(0);
    const [notes, setNotes] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastInvoiceData, setLastInvoiceData] = useState<{
        invoiceId: number; invoiceNumber: string; date: string; customerName: string;
        paymentMethod: string; items: { name: string; quantity: number; price: number; total: number }[];
        subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number;
    } | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

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
        if (!('serial' in navigator)) { showToast('❌ المتصفح لا يدعم WebSerial - استخدم Chrome'); return; }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 });
            setPosPort(port);
            setPosStatus('connected');
            showToast('✅ تم الاتصال بجهاز الدفع');
        } catch (e) { console.warn('POS connect:', e); showToast('❌ فشل الاتصال بجهاز الدفع'); }
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

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
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
                alert('❌ فشل في إضافة العميل');
            }
        } catch { alert('❌ خطأ في الاتصال'); }
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
                alert('❌ فشل في إضافة المنتج');
            }
        } catch { alert('❌ خطأ في الاتصال'); }
        finally { setSavingProd(false); }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setProducts(data); setFilteredProducts(data.slice(0, 20)); }
        } catch (err) { console.error(err); }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setCustomers(await res.json());
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
        const existing = cart.find(c => c.productId === p.id);
        if (existing) {
            setCart(cart.map(c => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                productId: p.id, productName: p.name, quantity: 1,
                price: p.sellPrice, discountRate: 0, taxRate: p.taxRate || 15,
                stock: p.currentStock, unitName: p.unit?.name || 'حبة',
            }]);
        }
        setSearch('');
        searchRef.current?.focus();
    };

    const updateCartItem = (idx: number, field: string, value: number) => {
        setCart(cart.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const removeCartItem = (idx: number) => {
        setCart(cart.filter((_, i) => i !== idx));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => {
        const itemTotal = item.quantity * item.price;
        const disc = itemTotal * (item.discountRate / 100);
        return sum + (itemTotal - disc);
    }, 0);
    const discountValue = subtotal * (discountRate / 100);
    const afterDiscount = subtotal - discountValue;
    const taxValue = afterDiscount * 0.15;
    const total = afterDiscount + taxValue;

    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(v);

    const handleSave = async (print = false, whatsapp = false) => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // For card payments with POS terminal: confirm payment FIRST
            if (paymentType === 'card' && posPort) {
                showToast('⏳ جاري إرسال المبلغ لجهاز مدى...');
                const result = await sendToPos(total);
                if (result === 'declined') {
                    showToast('❌ رفض جهاز الدفع - اضغط إعادة الإرسال');
                    setRetryPosAmount(total); setRetryInvoiceNo('');
                    setSaving(false);
                    return; // DO NOT save invoice
                } else if (result === 'error') {
                    showToast('⚠️ خطأ في جهاز الدفع - اضغط إعادة الإرسال');
                    setRetryPosAmount(total); setRetryInvoiceNo('');
                    setSaving(false);
                    return; // DO NOT save invoice
                }
                // approved or no_device → proceed to save
            }

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    customerId: customerId || null,
                    items: cart.map(c => ({
                        productId: c.productId, productName: c.productName,
                        quantity: c.quantity, price: c.price, discountRate: c.discountRate,
                    })),
                    discountRate,
                    paymentType,
                    paid: paidAmount ? parseFloat(paidAmount) : total,
                    userId: user.id,
                    notes,
                }),
            });
            if (res.ok) {
                const invoice = await res.json();
                if (paymentType === 'card' && posPort) {
                    showToast(`✅ تم الدفع وحفظ الفاتورة #${invoice.invoiceNo}`);
                } else {
                    showToast(`✅ تم حفظ الفاتورة #${invoice.invoiceNo}`);
                }
                setRetryPosAmount(null); setRetryInvoiceNo('');
                if (print) {
                    const customerName = customers.find(c => c.id.toString() === customerId)?.name || 'عميل نقدي';
                    setLastInvoiceData({
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.invoiceNo,
                        date: new Date().toISOString(),
                        customerName,
                        paymentMethod: paymentType,
                        items: cart.map(c => ({
                            name: c.productName,
                            quantity: c.quantity,
                            price: c.price,
                            total: c.quantity * c.price * (1 - c.discountRate / 100),
                        })),
                        subtotal,
                        discount: discountValue,
                        taxRate: 15,
                        taxAmount: taxValue,
                        grandTotal: total,
                    });
                    setShowReceipt(true);
                }
                // Open cash drawer for cash payments
                if (paymentType === 'cash') {
                    try {
                        const drawerCmd = '\x1B\x70\x00\x19\xFA';
                        const blob = new Blob([drawerCmd], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = url;
                        document.body.appendChild(iframe);
                        setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
                    } catch (e) { console.warn('Cash drawer open skipped:', e); }
                }
                // Send to WhatsApp
                if (whatsapp) {
                    const customerName = customers.find(c => c.id.toString() === customerId)?.name || 'عميل نقدي';
                    const customerPhone = '';
                    const itemsText = cart.map((c, i) =>
                        `${i + 1}. ${c.productName} × ${c.quantity} = ${fmt(c.quantity * c.price * (1 - c.discountRate / 100))} ر.س`
                    ).join('\n');
                    const text = `🧾 *فاتورة مبيعات #${invoice.invoiceNo}*\n` +
                        `📅 ${new Date().toLocaleDateString('ar-SA')}\n` +
                        `👤 ${customerName}\n\n` +
                        `📦 *الأصناف:*\n${itemsText}\n\n` +
                        `💰 المجموع: ${fmt(subtotal)} ر.س\n` +
                        `📊 الضريبة: ${fmt(taxValue)} ر.س\n` +
                        `✅ *الإجمالي: ${fmt(total)} ر.س*\n\n` +
                        `شكراً لتعاملكم معنا 🙏`;
                    const url = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                }
                setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId('');
                fetchProducts();
            } else {
                showToast('❌ فشل في حفظ الفاتورة');
            }
        } catch (err) {
            console.error(err);
            showToast('❌ خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleNewInvoice = () => {
        setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId('');
        setRetryPosAmount(null); setRetryInvoiceNo('');
        searchRef.current?.focus();
    };

    // Hold / Recall Invoice
    const holdInvoice = () => {
        if (cart.length === 0) { showToast('❌ لا توجد أصناف للتعليق'); return; }
        const now = new Date();
        const held: HeldInvoice = {
            id: Date.now().toString(),
            cart: [...cart],
            customerId,
            notes,
            discountRate,
            paidAmount,
            paymentType,
            heldAt: now.toISOString(),
            label: `${cart.length} صنف - ${now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`,
        };
        const updated = [...heldInvoices, held];
        setHeldInvoices(updated);
        localStorage.setItem('heldInvoices', JSON.stringify(updated));
        setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId('');
        showToast(`⏸️ تم تعليق الفاتورة (${held.label})`);
        searchRef.current?.focus();
    };

    const recallInvoice = (heldId: string) => {
        const held = heldInvoices.find(h => h.id === heldId);
        if (!held) return;
        // If current cart has items, hold it first
        if (cart.length > 0) {
            holdInvoice();
        }
        setCart(held.cart);
        setCustomerId(held.customerId);
        setNotes(held.notes);
        setDiscountRate(held.discountRate);
        setPaidAmount(held.paidAmount);
        setPaymentType(held.paymentType);
        const updated = heldInvoices.filter(h => h.id !== heldId);
        setHeldInvoices(updated);
        localStorage.setItem('heldInvoices', JSON.stringify(updated));
        setShowHeldPanel(false);
        showToast('▶️ تم استرجاع الفاتورة المعلقة');
    };

    const deleteHeldInvoice = (heldId: string) => {
        const updated = heldInvoices.filter(h => h.id !== heldId);
        setHeldInvoices(updated);
        localStorage.setItem('heldInvoices', JSON.stringify(updated));
        showToast('🗑️ تم حذف الفاتورة المعلقة');
    };

    // Invoice History
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setHistoryInvoices(await res.json());
        } catch (err) { console.error(err); }
        finally { setHistoryLoading(false); }
    };

    const openHistory = () => { setShowHistory(true); fetchHistory(); };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reprintInvoice = (inv: any) => {
        const items = (inv.details || []).map((d: { productName: string; quantity: number; price: number; discountRate: number; total: number }) => ({
            name: d.productName, quantity: d.quantity, price: d.price,
            total: d.quantity * d.price * (1 - (d.discountRate || 0) / 100),
        }));
        setLastInvoiceData({
            invoiceId: inv.id, invoiceNumber: String(inv.invoiceNo),
            date: inv.date, customerName: inv.customer?.name || 'عميل نقدي',
            paymentMethod: inv.paymentType, items,
            subtotal: inv.subtotal, discount: inv.discountValue || 0,
            taxRate: 15, taxAmount: inv.taxValue, grandTotal: inv.total,
        });
        setShowReceipt(true);
        setSelectedInvoice(null);
    };

    // WhatsApp Send
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendWhatsApp = (inv: any) => {
        const items = (inv.details || []).map((d: { productName: string; quantity: number; price: number; total: number }, i: number) =>
            `${i + 1}. ${d.productName} × ${d.quantity} = ${fmt(d.total)} ر.س`
        ).join('\n');
        const text = `🧾 *فاتورة مبيعات #${inv.invoiceNo}*\n` +
            `📅 ${new Date(inv.date).toLocaleDateString('ar-SA')}\n` +
            `👤 ${inv.customer?.name || 'عميل نقدي'}\n\n` +
            `📦 *الأصناف:*\n${items}\n\n` +
            `💰 المجموع: ${fmt(inv.subtotal)} ر.س\n` +
            `📊 الضريبة: ${fmt(inv.taxValue)} ر.س\n` +
            `✅ *الإجمالي: ${fmt(inv.total)} ر.س*\n\n` +
            `شكراً لتعاملكم معنا 🙏`;
        const phone = inv.customer?.phone || '';
        const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const retryPosPayment = async () => {
        if (!retryPosAmount || !posPort) return;
        setSaving(true);
        showToast('⏳ جاري إعادة الإرسال لجهاز مدى...');
        const result = await sendToPos(retryPosAmount);
        if (result === 'approved') {
            handleSave(false);
            return;
        } else {
            showToast('❌ فشل الدفع مرة أخرى - حاول مجدداً');
        }
        setSaving(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteInvoice = async (inv: any) => {
        if (!confirm(`هل أنت متأكد من حذف الفاتورة #${inv.invoiceNo}؟ سيتم استرجاع المخزون وحذف قيد الخزينة.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/sales?id=${inv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                showToast(`✅ تم حذف الفاتورة #${inv.invoiceNo}`);
                setSelectedInvoice(null);
                fetchHistory();
            } else {
                const data = await res.json();
                showToast(`❌ ${data.error || 'فشل في الحذف'}`);
            }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">🧾 فاتورة مبيعات</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={handleNewInvoice}>📄 جديدة</button>
                    <button className="btn btn-ghost btn-sm" onClick={holdInvoice} disabled={cart.length === 0}
                        style={{ color: 'var(--warning)' }}>⏸️ تعليق</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowHeldPanel(true)}
                        style={{ position: 'relative', color: heldInvoices.length > 0 ? 'var(--primary)' : undefined }}>
                        ▶️ استرجاع
                        {heldInvoices.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{heldInvoices.length}</span>}
                    </button>
                    <button className={`btn btn-sm ${voidMode ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setVoidMode(!voidMode); showToast(voidMode ? '✅ تم إلغاء وضع الحذف' : '🔴 وضع الإلغاء - اضغط على الصنف لحذفه'); }}
                        style={{ color: voidMode ? '#fff' : 'var(--danger)', background: voidMode ? 'var(--danger)' : undefined }}>🚫 إلغاء</button>
                    <button className="btn btn-ghost btn-sm" onClick={openHistory}>📋 الفواتير</button>
                </div>
            </div>

            <div className="page-content">
                <div className="pos-layout">
                    {/* Products Panel */}
                    <div className="pos-products">
                        <input
                            ref={searchRef}
                            className="input"
                            placeholder="🔍 بحث بالاسم أو الباركود..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && filteredProducts.length > 0) {
                                    addToCart(filteredProducts[0]);
                                }
                            }}
                            style={{ marginBottom: '12px' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                <div key={p.id} className="pos-product-item" onClick={() => addToCart(p)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {fmt(p.sellPrice)} ر.س | مخزون: {p.currentStock}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '18px', color: 'var(--primary)' }}>+</span>
                                </div>
                            )) : search.trim() ? (
                                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        ❌ لا يوجد منتج بهذا الباركود أو الاسم
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={openAddProduct}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        ➕ إضافة منتج جديد
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Invoice Panel */}
                    <div className="pos-invoice">
                        {/* Invoice Header */}
                        <div className="pos-invoice-header">
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <select className="input" style={{ width: '180px' }}
                                    value={customerId} onChange={e => setCustomerId(e.target.value)}>
                                    <option value="">عميل نقدي</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={() => setShowAddCustomer(true)} title="إضافة عميل جديد"
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700', minWidth: '34px' }}>+</button>
                            </div>
                            <select className="input" style={{ width: '140px' }}
                                value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                                <option value="cash">💵 نقداً</option>
                                <option value="card">💳 بطاقة</option>
                                <option value="transfer">🏦 تحويل</option>
                                {isAdmin && <option value="credit">📝 آجل</option>}
                                {isAdmin && <option value="installment">💳 تقسيط</option>}
                            </select>
                            <button onClick={connectPosManual} title={posStatus === 'connected' ? 'جهاز الدفع متصل' : posStatus === 'sending' ? 'جاري الإرسال...' : 'اضغط لربط جهاز الدفع'}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: posStatus === 'connected' ? '#22c55e15' : posStatus === 'sending' ? '#f59e0b15' : 'transparent', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: posStatus === 'connected' ? '#22c55e' : posStatus === 'sending' ? '#f59e0b' : '#ef4444', display: 'inline-block' }}></span>
                                {posStatus === 'connected' ? '🔗 مدى' : posStatus === 'sending' ? '⏳' : '📡 ربط مدى'}
                            </button>
                        </div>

                        {/* Cart Table */}
                        {voidMode && <div style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid var(--danger)', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', textAlign: 'center', fontWeight: '700', color: 'var(--danger)', fontSize: '13px', animation: 'pulse 1.5s infinite' }}>🚫 وضع الإلغاء - اضغط على الصنف لحذفه</div>}
                        <div className="pos-invoice-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>المنتج</th>
                                        <th style={{ width: '80px' }}>الكمية</th>
                                        <th style={{ width: '100px' }}>السعر</th>
                                        <th style={{ width: '80px' }}>خصم %</th>
                                        <th style={{ width: '100px' }}>الإجمالي</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="empty-state" style={{ padding: '40px' }}>
                                                    <div className="empty-state-icon">🧾</div>
                                                    <div className="empty-state-text">ابحث عن منتج وأضفه للفاتورة</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : cart.map((item, idx) => {
                                        const itemSub = item.quantity * item.price;
                                        const itemDisc = itemSub * (item.discountRate / 100);
                                        const itemTotal = itemSub - itemDisc;
                                        return (
                                            <tr key={idx} onClick={() => voidMode && removeCartItem(idx)}
                                                style={{ cursor: voidMode ? 'pointer' : undefined, background: voidMode ? 'rgba(239,68,68,0.05)' : undefined, transition: 'all 0.2s' }}>
                                                <td>
                                                    <div style={{ fontWeight: '600', fontSize: '13px', color: voidMode ? 'var(--danger)' : undefined }}>
                                                        {voidMode && '❌ '}{item.productName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input className="input" type="number" min="0.01" step="0.01"
                                                        value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
                                                </td>
                                                <td>
                                                    <span style={{ display: 'block', textAlign: 'center', padding: '6px 8px', fontWeight: '600', color: 'var(--text-primary)' }} dir="ltr">{fmt(item.price)}</span>
                                                </td>
                                                <td>
                                                    <input className="input" type="number" min="0" max="100"
                                                        value={item.discountRate} onChange={e => updateCartItem(idx, 'discountRate', parseFloat(e.target.value) || 0)}
                                                        style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
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
                                    <span>المجموع الفرعي</span>
                                    <span>{fmt(subtotal)} ر.س</span>
                                </div>
                                <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span>خصم</span>
                                    <input className="input" type="number" min="0" step="0.01"
                                        id="discount-input"
                                        value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(`✅ تم تطبيق خصم ${discountRate}%`); } }}
                                        style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
                                    <button onClick={() => { if (discountRate > 0) { showToast(`✅ تم تطبيق خصم ${discountRate}% = ${fmt(discountValue)} ر.س`); } }}
                                        style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: discountRate > 0 ? 'var(--primary)' : 'var(--bg-card-hover)', color: discountRate > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
                                        ✅ تطبيق
                                    </button>
                                    {discountRate > 0 && (
                                        <button onClick={() => { setDiscountRate(0); showToast('❌ تم إلغاء الخصم'); }}
                                            style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                            ✕ إلغاء
                                        </button>
                                    )}
                                    <span style={{ marginRight: 'auto', fontWeight: '600', color: discountRate > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                        {discountRate > 0 ? `- ${fmt(discountValue)}` : '0.00'} ر.س
                                    </span>
                                </div>
                                <div className="pos-total-row">
                                    <span>ضريبة القيمة المضافة (15%)</span>
                                    <span>{fmt(taxValue)} ر.س</span>
                                </div>
                                <div className="pos-total-row grand">
                                    <span>الإجمالي</span>
                                    <span style={{ color: 'var(--primary-light)' }}>{fmt(total)} ر.س</span>
                                </div>
                                {(paymentType === 'cash' || paymentType === 'credit' || paymentType === 'installment') && (
                                    <>
                                        <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>المبلغ المدفوع</span>
                                            <input className="input" type="number" min="0" step="0.01"
                                                value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                                                placeholder={fmt(total)} style={{ width: '120px', textAlign: 'center', padding: '4px 8px' }} dir="ltr" />
                                        </div>
                                        {paymentType === 'cash' && paidAmount && parseFloat(paidAmount) > total && (
                                            <div className="pos-total-row" style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '6px', padding: '8px' }}>
                                                <span style={{ fontWeight: '700', color: '#22c55e' }}>💰 الباقي</span>
                                                <span style={{ fontWeight: '700', fontSize: '18px', color: '#22c55e', fontFamily: 'monospace' }}>{fmt(parseFloat(paidAmount) - total)} ر.س</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pos-actions">
                                {retryPosAmount ? (
                                    <>
                                        <button className="btn" onClick={retryPosPayment} disabled={saving}
                                            style={{ background: '#f59e0b', color: '#fff', fontWeight: '700', flex: 1, animation: 'pulse 1.5s infinite' }}>
                                            {saving ? '⏳ جاري الإرسال...' : `🔄 إعادة إرسال ${fmt(retryPosAmount)} لمدى`}
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => { setRetryPosAmount(null); setRetryInvoiceNo(''); }}>❌ إلغاء</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving || cart.length === 0}>
                                            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
                                        </button>
                                        <button className="btn btn-success" onClick={() => handleSave(true)} disabled={saving || cart.length === 0}>
                                            🖨️ حفظ + طباعة
                                        </button>
                                        <button className="btn" onClick={() => handleSave(false, true)} disabled={saving || cart.length === 0}
                                            style={{ background: '#25D366', color: '#fff', fontWeight: '600' }}>
                                            📤 حفظ + واتساب
                                        </button>
                                        <button className="btn btn-ghost" onClick={handleNewInvoice}>📄 جديدة</button>
                                    </>
                                )}
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="ملاحظات على الفاتورة (اختياري)" />
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
                            <h3>➕ إضافة عميل جديد</h3>
                            <button className="modal-close" onClick={() => setShowAddCustomer(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder="اسم العميل *" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} autoFocus />
                            <input className="input" placeholder="رقم الجوال" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} dir="ltr" />
                            <input className="input" placeholder="الرقم الضريبي" value={newCust.taxNumber} onChange={e => setNewCust({ ...newCust, taxNumber: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="الشارع" value={newCust.street} onChange={e => setNewCust({ ...newCust, street: e.target.value })} />
                                <input className="input" placeholder="رقم المبنى" value={newCust.buildingNumber} onChange={e => setNewCust({ ...newCust, buildingNumber: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="الحي" value={newCust.district} onChange={e => setNewCust({ ...newCust, district: e.target.value })} />
                                <input className="input" placeholder="المدينة" value={newCust.city} onChange={e => setNewCust({ ...newCust, city: e.target.value })} />
                                <input className="input" placeholder="الرمز البريدي" value={newCust.postalCode} onChange={e => setNewCust({ ...newCust, postalCode: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" type="number" placeholder="حد الائتمان" value={newCust.creditLimit} onChange={e => setNewCust({ ...newCust, creditLimit: e.target.value })} dir="ltr" />
                                <select className="input" value={newCust.type} onChange={e => setNewCust({ ...newCust, type: e.target.value })}>
                                    <option value="0">عميل</option>
                                    <option value="1">مورد</option>
                                    <option value="2">عميل ومورد</option>
                                </select>
                            </div>
                            <input className="input" placeholder="ملاحظات" value={newCust.notes} onChange={e => setNewCust({ ...newCust, notes: e.target.value })} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddCustomer(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={saveNewCustomer} disabled={savingCust || !newCust.name.trim()}>
                                {savingCust ? '⏳ جاري الحفظ...' : '💾 حفظ'}
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
                            <h3>➕ إضافة منتج جديد</h3>
                            <button className="modal-close" onClick={() => setShowAddProduct(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder="اسم المنتج *" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} autoFocus />
                            <input className="input" placeholder="الباركود" value={newProd.barcode} onChange={e => setNewProd({ ...newProd, barcode: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>سعر الشراء</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.buyPrice} onChange={e => setNewProd({ ...newProd, buyPrice: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>سعر البيع *</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.sellPrice} onChange={e => setNewProd({ ...newProd, sellPrice: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>نسبة الضريبة %</label>
                                    <input className="input" type="number" placeholder="15" value={newProd.taxRate} onChange={e => setNewProd({ ...newProd, taxRate: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>الكمية الحالية</label>
                                    <input className="input" type="number" placeholder="0" value={newProd.currentStock} onChange={e => setNewProd({ ...newProd, currentStock: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddProduct(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={saveNewProduct} disabled={savingProd || !newProd.name.trim() || !newProd.sellPrice}>
                                {savingProd ? '⏳ جاري الحفظ...' : '💾 حفظ وإضافة للفاتورة'}
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
                            <h3>⏸️ الفواتير المعلقة ({heldInvoices.length})</h3>
                            <button className="modal-close" onClick={() => setShowHeldPanel(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {heldInvoices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                    <div>لا توجد فواتير معلقة</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {heldInvoices.map(held => {
                                        const heldTotal = held.cart.reduce((s, item) => {
                                            const t = item.quantity * item.price;
                                            return s + (t - t * (item.discountRate / 100));
                                        }, 0);
                                        const heldWithTax = heldTotal * 1.15;
                                        return (
                                            <div key={held.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>⏸️ {held.label}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {held.cart.map(c => c.productName).join('، ').substring(0, 60)}{held.cart.map(c => c.productName).join('، ').length > 60 ? '...' : ''}
                                                    </div>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '4px' }}>
                                                        الإجمالي: {fmt(heldWithTax)} ر.س
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}
                                                        onClick={() => recallInvoice(held.id)}>▶️ استرجاع</button>
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
                            <h3>📋 الفواتير السابقة</h3>
                            <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ overflow: 'auto', flex: 1 }}>
                            {historyLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
                            ) : historyInvoices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                                    <div>لا توجد فواتير</div>
                                </div>
                            ) : (
                                <table className="table" style={{ fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>التاريخ</th>
                                            <th>الوقت</th>
                                            <th>العميل</th>
                                            <th>الدفع</th>
                                            <th>الإجمالي</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyInvoices.map(inv => (
                                            <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                                <td>{new Date(inv.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{inv.customer?.name || 'عميل نقدي'}</td>
                                                <td>{inv.paymentType === 'cash' ? '💵' : inv.paymentType === 'card' ? '💳' : inv.paymentType === 'transfer' ? '🏦' : '📝'}</td>
                                                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{fmt(inv.total)} ر.س</td>
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
                            <h3>🧾 فاتورة #{selectedInvoice.invoiceNo}</h3>
                            <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '13px' }}>
                                <div><strong>📅 التاريخ:</strong> {new Date(selectedInvoice.date).toLocaleDateString('ar-SA')}</div>
                                <div><strong>⏰ الوقت:</strong> {new Date(selectedInvoice.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div><strong>👤 العميل:</strong> {selectedInvoice.customer?.name || 'عميل نقدي'}</div>
                                <div><strong>💳 الدفع:</strong> {selectedInvoice.paymentType === 'cash' ? 'نقداً' : selectedInvoice.paymentType === 'card' ? 'بطاقة' : selectedInvoice.paymentType === 'transfer' ? 'تحويل' : 'آجل'}</div>
                            </div>
                            <table className="table" style={{ fontSize: '13px', marginBottom: '16px' }}>
                                <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>المجموع الفرعي</span><span>{fmt(selectedInvoice.subtotal)} ر.س</span></div>
                                {selectedInvoice.discountValue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger)' }}><span>الخصم</span><span>-{fmt(selectedInvoice.discountValue)} ر.س</span></div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>الضريبة 15%</span><span>{fmt(selectedInvoice.taxValue)} ر.س</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', borderTop: '1px solid var(--border)', paddingTop: '8px', color: 'var(--primary)' }}><span>الإجمالي</span><span>{fmt(selectedInvoice.total)} ر.س</span></div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={() => reprintInvoice(selectedInvoice)}>🖨️ طباعة</button>
                            <button className="btn btn-success" onClick={() => sendWhatsApp(selectedInvoice)} style={{ background: '#25D366' }}>📤 واتساب</button>
                            {canDelete && <button className="btn" onClick={() => deleteInvoice(selectedInvoice)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>🗑️ حذف</button>}
                            <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </>

    );
}
