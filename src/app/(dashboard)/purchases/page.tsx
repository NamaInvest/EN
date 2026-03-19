'use client';

import { useState, useEffect, useRef } from 'react';

interface Product { id: number; name: string; barcode: string; buyPrice: number; currentStock: number; unit?: { name: string }; }
interface CartItem { productId: number; productName: string; quantity: number; price: number; discountRate: number; }
interface Customer { id: number; name: string; taxNumber?: string; }
interface PurchaseInvoice { id: number; invoiceNo: number; date: string; total: number; paid: number; remaining: number; status: string; paymentType: string; receiptStatus?: string; supplier?: { name: string } | null; }

export default function PurchasesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [supplierId, setSupplierId] = useState('');
    const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
    const [stockId, setStockId] = useState('1');
    const [paymentType, setPaymentType] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [ocrLoading, setOcrLoading] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Payment & Receipts tracking
    const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'receipts'>('new');
    const [pendingInvoices, setPendingInvoices] = useState<PurchaseInvoice[]>([]);
    const [pendingReceipts, setPendingReceipts] = useState<PurchaseInvoice[]>([]);
    const [payingId, setPayingId] = useState<number | null>(null);
    const [payValue, setPayValue] = useState('');
    const [payingSaving, setPayingSaving] = useState(false);
    const [receivingId, setReceivingId] = useState<number | null>(null);

    // Quick Add Supplier
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '' });
    const [savingSupplier, setSavingSupplier] = useState(false);

    // Quick Add Product
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProd, setNewProd] = useState({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
    const [savingProd, setSavingProd] = useState(false);

    // Smart OCR Modal
    const [showOcrModal, setShowOcrModal] = useState(false);
    const [ocrImagePreviewUrl, setOcrImagePreviewUrl] = useState('');
    const [ocrFileType, setOcrFileType] = useState('');
    const [ocrData, setOcrData] = useState<any>(null);

    // Permission-based delete
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        fetchAll();
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
            setCanDelete(u.role === 'admin' || perms.includes('delete_invoices'));
        } catch { }
    }, []);

    const fetchAll = async () => {
        const token = localStorage.getItem('token');
        const [pRes, sRes, wRes] = await Promise.all([
            fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (pRes.ok) { const d = await pRes.json(); setProducts(d); setFiltered(d.slice(0, 20)); }
        if (sRes.ok) setSuppliers(await sRes.json());
        if (wRes.ok) setWarehouses(await wRes.json());
        fetchPending();
    };

    const fetchPending = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/purchases?status=pending', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPendingInvoices(await res.json());
    };

    const fetchReceipts = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/purchases?receiptStatus=pending', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPendingReceipts(await res.json());
    };

    const deletePurchaseInvoice = async (inv: PurchaseInvoice) => {
        if (!confirm(`هل أنت متأكد من حذف فاتورة المشتريات #${inv.invoiceNo}؟ سيتم خصم المخزون وحذف قيد الخزينة.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/purchases?id=${inv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { setToast(`✅ تم حذف فاتورة المشتريات #${inv.invoiceNo}`); setTimeout(() => setToast(''), 3000); fetchPending(); }
            else { const d = await res.json(); setToast(`❌ ${d.error || 'فشل'}`); setTimeout(() => setToast(''), 3000); }
        } catch { setToast('❌ خطأ في الاتصال'); setTimeout(() => setToast(''), 3000); }
    };

    const saveNewSupplier = async () => {
        if (!newSupplier.name.trim()) return;
        setSavingSupplier(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...newSupplier, type: '1' }),
            });
            if (res.ok) {
                const created = await res.json();
                const sRes = await fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } });
                if (sRes.ok) setSuppliers(await sRes.json());
                setSupplierId(created.id.toString());
                setShowAddSupplier(false);
                setNewSupplier({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '' });
                setToast('✅ تم إضافة المورد'); setTimeout(() => setToast(''), 3000);
            } else { setToast('❌ فشل في إضافة المورد'); setTimeout(() => setToast(''), 3000); }
        } catch { setToast('❌ خطأ في الاتصال'); setTimeout(() => setToast(''), 3000); }
        finally { setSavingSupplier(false); }
    };

    useEffect(() => {
        if (!search) { setFiltered(products.slice(0, 20)); return; }
        const s = search.toLowerCase();
        setFiltered(products.filter(p => p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s))).slice(0, 20));
    }, [search, products]);

    const addToCart = (p: Product) => {
        const existing = cart.find(c => c.productId === p.id);
        if (existing) setCart(cart.map(c => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c));
        else setCart([...cart, { productId: p.id, productName: p.name, quantity: 1, price: p.buyPrice, discountRate: 0 }]);
        setSearch(''); searchRef.current?.focus();
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
                const pRes = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
                if (pRes.ok) { const d = await pRes.json(); setProducts(d); }
                addToCart({ id: created.id, name: created.name, barcode: created.barcode, buyPrice: created.buyPrice || parseFloat(newProd.buyPrice) || 0, currentStock: created.currentStock, unit: undefined });
                setShowAddProduct(false);
                setNewProd({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
                setToast('✅ تم إضافة المنتج'); setTimeout(() => setToast(''), 3000);
            } else { setToast('❌ فشل في إضافة المنتج'); setTimeout(() => setToast(''), 3000); }
        } catch { setToast('❌ خطأ في الاتصال'); setTimeout(() => setToast(''), 3000); }
        finally { setSavingProd(false); }
    };

    const updateItem = (i: number, f: string, v: number) => setCart(cart.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
    const removeItem = (i: number) => setCart(cart.filter((_, idx) => idx !== i));

    const subtotal = cart.reduce((s, item) => { const t = item.quantity * item.price; return s + t - t * (item.discountRate / 100); }, 0);
    const taxValue = subtotal * 0.15;
    const total = subtotal + taxValue;
    const actualPaid = paymentType === 'credit' ? (parseFloat(paidAmount) || 0) : total;
    const remaining = total - actualPaid;
    const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    const handleSave = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch('/api/purchases', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ supplierId: supplierId || null, stockId: stockId || '1', items: cart, paymentType, supplierInvoiceNo, paid: actualPaid, userId: user.id, notes }),
            });
            if (res.ok) {
                const inv = await res.json();
                const msg = paymentType === 'credit' && remaining > 0
                    ? `✅ تم حفظ فاتورة مشتريات آجلة #${inv.invoiceNo} - المتبقي: ${fmt(remaining)} ر.س`
                    : `✅ تم حفظ فاتورة المشتريات #${inv.invoiceNo}`;
                setToast(msg);
                setCart([]); setNotes(''); setSupplierId(''); setSupplierInvoiceNo(''); setPaidAmount(''); setPaymentType('cash'); fetchAll();
            } else setToast('❌ فشل في الحفظ');
        } catch { setToast('❌ خطأ'); }
        finally { setSaving(false); setTimeout(() => setToast(''), 4000); }
    };

    const handlePayment = async (invoiceId: number) => {
        const amount = parseFloat(payValue);
        if (!amount || amount <= 0) { setToast('❌ أدخل مبلغ صحيح'); setTimeout(() => setToast(''), 3000); return; }
        setPayingSaving(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch('/api/purchases', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invoiceId, amount, userId: user.id }),
            });
            if (res.ok) {
                setToast(`✅ تم تسديد ${fmt(amount)} ر.س`);
                setPayingId(null); setPayValue(''); fetchPending(); fetchAll();
            } else {
                const data = await res.json();
                setToast(`❌ ${data.error || 'فشل في التسديد'}`);
            }
        } catch { setToast('❌ خطأ في التسديد'); }
        finally { setPayingSaving(false); setTimeout(() => setToast(''), 4000); }
    };
    const handleReceiveGoods = async (invoiceId: number) => {
        if (!confirm('تأكيد استلام بضاعة هذه الفاتورة وإدخالها للمخزون؟')) return;
        setReceivingId(invoiceId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/purchases/${invoiceId}/receive`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setToast('✅ تم استلام البضاعة وإضافتها للمخزون');
                fetchReceipts();
            } else {
                const data = await res.json();
                setToast(`❌ ${data.error || 'فشل في الاستلام'}`);
            }
        } catch { setToast('❌ خطأ في الاتصال'); }
        finally { setReceivingId(null); setTimeout(() => setToast(''), 4000); }
    };
    const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setOcrLoading(true);
        setToast('⏳ جاري قراءة الفاتورة الذكية عبر الذكاء الاصطناعي...');
        const previewUrl = URL.createObjectURL(file);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/purchases/ocr', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const result = await res.json();
            if (result.success && result.data) {
                setOcrFileType(file.type);
                setOcrImagePreviewUrl(previewUrl);
                setOcrData(result.data);
                setShowOcrModal(true);
                setToast(result.message || '✅ تمت القراءة بنجاح');
            } else {
                setToast(`⚠️ ${result.error || 'فشل في استخراج البيانات'}`);
            }
        } catch (err) {
            console.error('OCR error:', err);
            setToast('❌ فشل في قراءة الملف');
        } finally {
            setOcrLoading(false);
            if (fileRef.current) fileRef.current.value = '';
            setTimeout(() => setToast(''), 4000);
        }
    };

    const confirmOcrData = () => {
        if (!ocrData) return;
        
        // Auto-match Supplier based on Tax Number or Name
        if (ocrData.taxNumber || ocrData.supplierName) {
            const foundSupplier = suppliers.find(s => 
                (ocrData.taxNumber && s.taxNumber === ocrData.taxNumber) ||
                (ocrData.supplierName && s.name.includes(ocrData.supplierName))
            );
            if (foundSupplier) {
                setSupplierId(foundSupplier.id.toString());
            } else if (ocrData.supplierName) {
                setNewSupplier(prev => ({ ...prev, name: ocrData.supplierName || '', taxNumber: ocrData.taxNumber || '' }));
                setToast('⚠️ المورد غير موجود، يمكنك إضافته من زر (+)');
            }
        }
        
        if (ocrData.invoiceNo) setSupplierInvoiceNo(ocrData.invoiceNo);
        
        if (ocrData.items && ocrData.items.length > 0) {
             const newItems: CartItem[] = ocrData.items.map((item: { name: string; price: number; quantity: number }) => ({
                 productId: 0, productName: String(item.name || 'بدون اسم'),
                 quantity: Number(item.quantity) || 1, price: Number(item.price) || 0, discountRate: 0,
             }));
             setCart(prev => [...prev, ...newItems]);
        }
        
        setShowOcrModal(false);
    };

    return (
        <>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleOcrUpload} style={{ display: 'none' }} />
            <div className="page-header">
                <h1 className="page-title">🛒 المشتريات</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('new')}>➕ فاتورة جديدة</button>
                    <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('pending'); fetchPending(); }}
                        style={{ position: 'relative' }}>
                        💳 فواتير آجلة
                        {pendingInvoices.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{pendingInvoices.length}</span>}
                    </button>
                    <button className={`btn ${activeTab === 'receipts' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('receipts'); fetchReceipts(); }}
                        style={{ position: 'relative' }}>
                        📦 استلام بضائع
                        {pendingReceipts.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{pendingReceipts.length}</span>}
                    </button>
                    {activeTab === 'new' && <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={ocrLoading}>
                        {ocrLoading ? '⏳ جاري القراءة...' : '📷 رفع فاتورة'}
                    </button>}
                </div>
            </div>
            <div className="page-content">
                {activeTab === 'new' ? (
                    <div className="pos-layout">
                        <div className="pos-products">
                            <input ref={searchRef} className="input" placeholder="🔍 بحث بالاسم أو الباركود..." value={search}
                                onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && filtered.length > 0) addToCart(filtered[0]); }}
                                style={{ marginBottom: '12px' }} />
                            {filtered.length > 0 ? filtered.map(p => (
                                <div key={p.id} className="pos-product-item" onClick={() => addToCart(p)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmt(p.buyPrice)} ر.س | مخزون: {p.currentStock}</div>
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
                        <div className="pos-invoice">
                            <div className="pos-invoice-header">
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <select className="input" style={{ width: '170px' }} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                                        <option value="">اختر المورد</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowAddSupplier(true)} title="إضافة مورد جديد"
                                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700', minWidth: '34px' }}>+</button>
                                </div>
                                <select className="input" style={{ width: '130px' }} value={stockId} onChange={e => setStockId(e.target.value)}>
                                    <option value="1">المستودع الرئيسي</option>
                                    {warehouses.filter(w => w.id !== 1).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                                <input className="input" style={{ width: '140px' }} placeholder="رقم فاتورة المورد" value={supplierInvoiceNo}
                                    onChange={e => setSupplierInvoiceNo(e.target.value)} dir="ltr" />
                                <select className="input" style={{ width: '130px' }} value={paymentType} onChange={e => { setPaymentType(e.target.value); if (e.target.value !== 'credit') setPaidAmount(''); }}>
                                    <option value="cash">💵 نقداً</option>
                                    <option value="card">💳 بطاقة</option>
                                    <option value="transfer">🏦 تحويل</option>
                                    <option value="credit">📋 آجل</option>
                                </select>
                            </div>
                            {paymentType === 'credit' && (
                                <div style={{ padding: '10px 16px', background: 'rgba(255,193,7,0.1)', borderBottom: '1px solid rgba(255,193,7,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--warning)' }}>💰 دفعة مقدمة:</span>
                                    <input className="input" type="number" min="0" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                                        placeholder="0.00" dir="ltr" style={{ width: '130px', textAlign: 'center' }} />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ر.س (اتركه فارغ = بدون دفعة)</span>
                                </div>
                            )}
                            <div className="pos-invoice-table">
                                <table className="table">
                                    <thead><tr><th>المنتج</th><th style={{ width: '80px' }}>الكمية</th><th style={{ width: '100px' }}>السعر</th><th style={{ width: '80px' }}>خصم %</th><th style={{ width: '100px' }}>الإجمالي</th><th style={{ width: '40px' }}></th></tr></thead>
                                    <tbody>
                                        {cart.length === 0 ? (
                                            <tr><td colSpan={6}><div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-icon">🛒</div><div className="empty-state-text">ابحث عن منتج وأضفه للفاتورة</div></div></td></tr>
                                        ) : cart.map((item, idx) => {
                                            const iSub = item.quantity * item.price; const iTotal = iSub - iSub * (item.discountRate / 100);
                                            return (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: '600', fontSize: '13px' }}>{item.productName}</td>
                                                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td><input className="input" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td><input className="input" type="number" min="0" max="100" value={item.discountRate} onChange={e => updateItem(idx, 'discountRate', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" /></td>
                                                    <td style={{ fontWeight: '600' }}>{fmt(iTotal)}</td>
                                                    <td><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pos-invoice-footer">
                                <div className="pos-totals">
                                    <div className="pos-total-row"><span>المجموع</span><span>{fmt(subtotal)} ر.س</span></div>
                                    <div className="pos-total-row"><span>ضريبة 15%</span><span>{fmt(taxValue)} ر.س</span></div>
                                    <div className="pos-total-row grand"><span>الإجمالي</span><span style={{ color: 'var(--info-light)' }}>{fmt(total)} ر.س</span></div>
                                    {paymentType === 'credit' && (
                                        <>
                                            <div className="pos-total-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '8px', marginTop: '4px' }}>
                                                <span style={{ color: 'var(--success)' }}>💰 المدفوع</span><span style={{ color: 'var(--success)' }}>{fmt(actualPaid)} ر.س</span>
                                            </div>
                                            <div className="pos-total-row">
                                                <span style={{ color: 'var(--warning)' }}>⏳ المتبقي</span><span style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '16px' }}>{fmt(remaining)} ر.س</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="pos-actions">
                                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || cart.length === 0}>{saving ? '⏳' : '💾'} حفظ</button>
                                    <button className="btn btn-ghost" onClick={() => { setCart([]); setNotes(''); setPaidAmount(''); }}>📄 جديدة</button>
                                </div>
                                <div style={{ marginTop: '12px' }}><input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" /></div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'pending' ? (
                    /* Pending Invoices Tab */
                    <div className="card">
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>📋 فواتير مشتريات آجلة ({pendingInvoices.length})</h2>
                            <div style={{ fontSize: '14px', color: 'var(--warning)', fontWeight: '600' }}>
                                إجمالي المستحق: {fmt(pendingInvoices.reduce((s, inv) => s + inv.remaining, 0))} ر.س
                            </div>
                        </div>
                        {pendingInvoices.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-text">لا توجد فواتير آجلة مستحقة</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>رقم الفاتورة</th>
                                            <th>التاريخ</th>
                                            <th>المورد</th>
                                            <th>الإجمالي</th>
                                            <th>المدفوع</th>
                                            <th>المتبقي</th>
                                            <th style={{ width: '200px' }}>تسديد دفعة</th>
                                            {canDelete && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingInvoices.map(inv => (
                                            <tr key={inv.id}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                                <td>{inv.supplier?.name || 'بدون مورد'}</td>
                                                <td>{fmt(inv.total)} ر.س</td>
                                                <td style={{ color: 'var(--success)' }}>{fmt(inv.paid)} ر.س</td>
                                                <td style={{ color: 'var(--warning)', fontWeight: '700' }}>{fmt(inv.remaining)} ر.س</td>
                                                <td>
                                                    {payingId === inv.id ? (
                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                            <input className="input" type="number" min="0.01" step="0.01" max={inv.remaining} value={payValue}
                                                                onChange={e => setPayValue(e.target.value)} placeholder={fmt(inv.remaining)}
                                                                dir="ltr" style={{ width: '100px', textAlign: 'center', padding: '6px' }} autoFocus />
                                                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}
                                                                onClick={() => handlePayment(inv.id)} disabled={payingSaving}>
                                                                {payingSaving ? '⏳' : '✅'}
                                                            </button>
                                                            <button className="btn btn-ghost" style={{ padding: '6px 8px', fontSize: '12px' }}
                                                                onClick={() => { setPayingId(null); setPayValue(''); }}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}
                                                            onClick={() => { setPayingId(inv.id); setPayValue(String(inv.remaining)); }}>
                                                            💰 تسديد
                                                        </button>
                                                    )}
                                                </td>
                                                {canDelete && <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => deletePurchaseInvoice(inv)} style={{ color: '#ef4444', fontSize: '12px' }}>🗑️</button>
                                                </td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'receipts' ? (
                    /* Pending Receipts Tab */
                    <div className="card">
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>📦 بضائع بانتظار الاستلام المخزني ({pendingReceipts.length})</h2>
                        </div>
                        {pendingReceipts.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-text">لا توجد بضائع بانتظار الاستلام</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>رقم الفاتورة</th>
                                            <th>التاريخ</th>
                                            <th>المورد</th>
                                            <th>الإجمالي</th>
                                            <th>الدفع</th>
                                            <th>حالة الاستلام</th>
                                            <th style={{ width: '150px' }}>إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingReceipts.map(inv => (
                                            <tr key={inv.id}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                                <td>{inv.supplier?.name || 'بدون مورد'}</td>
                                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(inv.total)} ر.س</td>
                                                <td>{inv.paymentType === 'cash' ? 'نقداً' : inv.paymentType === 'transfer' ? 'تحويل' : inv.paymentType === 'card' ? 'بطاقة' : 'آجل'}</td>
                                                <td><span style={{ padding: '4px 8px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}>⏳ بانتظار الاستلام</span></td>
                                                <td>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        onClick={() => handleReceiveGoods(inv.id)} disabled={receivingId === inv.id}>
                                                        {receivingId === inv.id ? '⏳' : '📥 استلام البضاعة'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : toast.includes('⚠️') ? 'toast-warning' : 'toast-error'}`}>{toast}</div></div>}

            {/* Quick Add Supplier Modal */}
            {showAddSupplier && (
                <div className="modal-overlay" onClick={() => setShowAddSupplier(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>➕ إضافة مورد جديد</h3>
                            <button className="modal-close" onClick={() => setShowAddSupplier(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder="اسم المورد *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} autoFocus />
                            <input className="input" placeholder="رقم الجوال" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} dir="ltr" />
                            <input className="input" placeholder="الرقم الضريبي" value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="الشارع" value={newSupplier.street} onChange={e => setNewSupplier({ ...newSupplier, street: e.target.value })} />
                                <input className="input" placeholder="رقم المبنى" value={newSupplier.buildingNumber} onChange={e => setNewSupplier({ ...newSupplier, buildingNumber: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="الحي" value={newSupplier.district} onChange={e => setNewSupplier({ ...newSupplier, district: e.target.value })} />
                                <input className="input" placeholder="المدينة" value={newSupplier.city} onChange={e => setNewSupplier({ ...newSupplier, city: e.target.value })} />
                                <input className="input" placeholder="الرمز البريدي" value={newSupplier.postalCode} onChange={e => setNewSupplier({ ...newSupplier, postalCode: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" type="number" placeholder="حد الائتمان" value={newSupplier.creditLimit} onChange={e => setNewSupplier({ ...newSupplier, creditLimit: e.target.value })} dir="ltr" />
                                <input className="input" placeholder="ملاحظات" value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddSupplier(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={saveNewSupplier} disabled={savingSupplier || !newSupplier.name.trim()}>
                                {savingSupplier ? '⏳ جاري الحفظ...' : '💾 حفظ'}
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
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>سعر الشراء *</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.buyPrice} onChange={e => setNewProd({ ...newProd, buyPrice: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>سعر البيع</label>
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
                            <button className="btn btn-primary" onClick={saveNewProduct} disabled={savingProd || !newProd.name.trim()}>
                                {savingProd ? '⏳ جاري الحفظ...' : '💾 حفظ وإضافة للفاتورة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Invoice Reader Modal */}
            {showOcrModal && ocrData && (
                <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%' }}>
                        <div className="modal-header">
                            <h3>👁️ قارئ الفواتير الذكي (AI)</h3>
                            <button className="modal-close" onClick={() => setShowOcrModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                            {/* Image Preview Left Side */}
                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', maxHeight: '70vh', minHeight: '400px' }}>
                                {ocrFileType.includes('pdf') ? (
                                    <iframe src={ocrImagePreviewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF Preview" />
                                ) : (
                                    <img src={ocrImagePreviewUrl} alt="Invoice Preview" style={{ maxWidth: '100%', objectFit: 'contain' }} />
                                )}
                            </div>
                            
                            {/* Data Form Right Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#1e40af', fontSize: '15px' }}>بيانات الفاتورة الأساسية</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>اسم المورد</label>
                                            <input className="input" value={ocrData.supplierName || ''} onChange={e => setOcrData({ ...ocrData, supplierName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>الرقم الضريبي</label>
                                            <input className="input" value={ocrData.taxNumber || ''} onChange={e => setOcrData({ ...ocrData, taxNumber: e.target.value })} dir="ltr" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>التاريخ</label>
                                                <input className="input" type="date" value={ocrData.date || ''} onChange={e => setOcrData({ ...ocrData, date: e.target.value })} dir="ltr" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>رقم الفاتورة</label>
                                                <input className="input" value={ocrData.invoiceNo || ''} onChange={e => setOcrData({ ...ocrData, invoiceNo: e.target.value })} dir="ltr" />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>مبلغ الضريبة</label>
                                                <input className="input" type="number" value={ocrData.taxAmount || ''} onChange={e => setOcrData({ ...ocrData, taxAmount: e.target.value })} dir="ltr" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>مبلغ الفاتورة (الإجمالي)</label>
                                                <input className="input" type="number" value={ocrData.grandTotal || ''} onChange={e => setOcrData({ ...ocrData, grandTotal: e.target.value })} dir="ltr" style={{ fontWeight: 'bold' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>الأصناف المستخرجة ({ocrData.items?.length || 0})</h4>
                                    {ocrData.items && ocrData.items.length > 0 ? (
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <table className="table" style={{ fontSize: '12px' }}>
                                                <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr></thead>
                                                <tbody>
                                                    {ocrData.items.map((it: any, i: number) => (
                                                        <tr key={i}>
                                                            <td><input className="input" style={{ padding: '4px', fontSize: '12px' }} value={it.name || ''} onChange={e => { const newItems = [...ocrData.items]; newItems[i].name = e.target.value; setOcrData({ ...ocrData, items: newItems }); }} /></td>
                                                            <td><input className="input" style={{ width: '60px', padding: '4px', textAlign: 'center' }} type="number" dir="ltr" value={it.quantity || ''} onChange={e => { const newItems = [...ocrData.items]; newItems[i].quantity = e.target.value; setOcrData({ ...ocrData, items: newItems }); }} /></td>
                                                            <td><input className="input" style={{ width: '80px', padding: '4px', textAlign: 'center' }} type="number" dir="ltr" value={it.price || ''} onChange={e => { const newItems = [...ocrData.items]; newItems[i].price = e.target.value; setOcrData({ ...ocrData, items: newItems }); }} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: '20px', fontSize: '13px' }}>لم يتم التعرف على أصناف متطابقة</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '15px', background: '#f8fafc' }}>
                            <button className="btn btn-ghost" onClick={() => setShowOcrModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={confirmOcrData} style={{ background: '#10b981', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '15px', padding: '10px 24px' }}>
                                <span>📥</span> حفظ وإضافة للفاتورة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
