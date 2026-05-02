'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Product { id: number; name: string; barcode: string; buyPrice: number; currentStock: number; unit?: { name: string }; }
interface CartItem { productId: number; productName: string; quantity: number; price: number; discountRate: number; }
interface Customer { id: number; name: string; taxNumber?: string; }
interface PurchaseInvoice { id: number; invoiceNo: number; isManual?: boolean; date: string; total: number; paid: number; remaining: number; status: string; paymentType: string; receiptStatus?: string; supplier?: { name: string } | null; }

export default function PurchasesPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
    const [isManual, setIsManual] = useState(false);
    const [manualSubtotal, setManualSubtotal] = useState('');
    const [manualTaxValue, setManualTaxValue] = useState('');
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
        if (pRes.ok) { const d = await pRes.json(); const arr = Array.isArray(d) ? d : []; setProducts(arr); setFiltered(arr.slice(0, 20)); }
        if (sRes.ok) { const d = await sRes.json(); setSuppliers(Array.isArray(d) ? d : []); }
        if (wRes.ok) { const d = await wRes.json(); setWarehouses(Array.isArray(d) ? d : []); }
        fetchPending();
    };

    const fetchPending = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/purchases?status=pending', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setPendingInvoices(Array.isArray(d) ? d : []); }
    };

    const fetchReceipts = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/purchases?receiptStatus=pending', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setPendingReceipts(Array.isArray(d) ? d : []); }
    };

    const deletePurchaseInvoice = async (inv: PurchaseInvoice) => {
        if (!confirm(`هل أنت متأكد من حذف فاتورة المشتريات #${inv.invoiceNo}؟ سيتم خصم المخزون وحذف قيد الخزينة.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/purchases?id=${inv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { setToast(`✅ تم حذف فاتورة المشتريات #${inv.invoiceNo}`); setTimeout(() => setToast(''), 3000); fetchPending(); }
            else { const d = await res.json(); setToast(`❌ ${d.error || t('sys.str_591')}`); setTimeout(() => setToast(''), 3000); }
        } catch { setToast(t('sys.str_419')); setTimeout(() => setToast(''), 3000); }
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
                setToast(t('purchases.str_1017')); setTimeout(() => setToast(''), 3000);
            } else { setToast(t('purchases.str_1018')); setTimeout(() => setToast(''), 3000); }
        } catch { setToast(t('sys.str_419')); setTimeout(() => setToast(''), 3000); }
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
                setToast(t('purchases.str_1019')); setTimeout(() => setToast(''), 3000);
            } else { setToast(t('sys.str_812')); setTimeout(() => setToast(''), 3000); }
        } catch { setToast(t('sys.str_419')); setTimeout(() => setToast(''), 3000); }
        finally { setSavingProd(false); }
    };

    const updateItem = (i: number, f: string, v: number) => setCart(cart.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
    const removeItem = (i: number) => setCart(cart.filter((_, idx) => idx !== i));

    const totalItems = cart.length;
    const totalUnits = cart.reduce((s, item) => s + (item.quantity || 0), 0);
    const subtotal = cart.reduce((s, item) => { const t = item.quantity * item.price; return s + t - t * (item.discountRate / 100); }, 0);
    const taxValue = subtotal * 0.15;
    const total = subtotal + taxValue;
    const actualPaid = paymentType === 'credit' ? (parseFloat(paidAmount) || 0) : total;
    const remaining = total - actualPaid;
    const fmt = (v: number) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleSave = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch('/api/purchases', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isManual, manualSubtotal: parseFloat(manualSubtotal) || 0, manualTaxValue: parseFloat(manualTaxValue) || 0, supplierId: supplierId || null, stockId: stockId || '1', items: cart, paymentType, supplierInvoiceNo, paid: actualPaid, userId: user.id, notes }),
            });
            if (res.ok) {
                const inv = await res.json();
                const msg = paymentType === 'credit' && remaining > 0
                    ? `✅ تم حفظ فاتورة مشتريات آجلة #${inv.invoiceNo} - المتبقي: ${fmt(remaining)} ر.س`
                    : `✅ تم حفظ فاتورة المشتريات #${inv.invoiceNo}`;
                setToast(msg);
                setCart([]); setNotes(''); setSupplierId(''); setSupplierInvoiceNo(''); setPaidAmount(''); setPaymentType('cash'); setIsManual(false); setManualSubtotal(''); setManualTaxValue(''); fetchAll();
            } else setToast(t('purchases.str_1020'));
        } catch { setToast(t('sys.str_592')); }
        finally { setSaving(false); setTimeout(() => setToast(''), 4000); }
    };

    const handlePayment = async (invoiceId: number) => {
        const amount = parseFloat(payValue);
        if (!amount || amount <= 0) { setToast(t('purchases.str_1021')); setTimeout(() => setToast(''), 3000); return; }
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
                setToast(`❌ ${data.error || t('purchases.str_1022')}`);
            }
        } catch { setToast(t('purchases.str_1023')); }
        finally { setPayingSaving(false); setTimeout(() => setToast(''), 4000); }
    };
    const handleReceiveGoods = async (invoiceId: number) => {
        if (!confirm(t('purchases.str_1024'))) return;
        setReceivingId(invoiceId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/purchases/${invoiceId}/receive`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setToast(t('purchases.str_1025'));
                fetchReceipts();
            } else {
                const data = await res.json();
                setToast(`❌ ${data.error || t('purchases.str_1026')}`);
            }
        } catch { setToast(t('sys.str_419')); }
        finally { setReceivingId(null); setTimeout(() => setToast(''), 4000); }
    };
    const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setOcrLoading(true);
        setToast(t('purchases.str_1027'));
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
                setToast(result.message || t('purchases.str_1028'));
            } else {
                setToast(`⚠️ ${result.error || t('purchases.str_1029')}`);
            }
        } catch (err) {
            console.error('OCR error:', err);
            setToast(t('purchases.str_1030'));
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
                setToast(t('purchases.str_1031'));
            }
        }
        
        if (ocrData.invoiceNo) setSupplierInvoiceNo(ocrData.invoiceNo);
        
        if (ocrData.items && ocrData.items.length > 0) {
             const newItems: CartItem[] = ocrData.items.map((item: { name: string; price: number; quantity: number }) => ({
                 productId: 0, productName: String(item.name || t('purchases.str_1032')),
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
                <h1 className="page-title">{t('purchases.str_971')}</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('new')}>{t('purchases.str_972')}</button>
                    <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('pending'); fetchPending(); }}
                        style={{ position: 'relative' }}>
                        {t('purchases.str_973')}{pendingInvoices.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{pendingInvoices.length}</span>}
                    </button>
                    <button className={`btn ${activeTab === 'receipts' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('receipts'); fetchReceipts(); }}
                        style={{ position: 'relative' }}>
                        {t('purchases.str_974')}{pendingReceipts.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{pendingReceipts.length}</span>}
                    </button>
                    {activeTab === 'new' && <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={ocrLoading}>
                        {ocrLoading ? t('purchases.str_1033') : t('purchases.str_1034')}
                    </button>}
                </div>
            </div>
            <div className="page-content">
                {activeTab === 'new' ? (
                    <div className="pos-layout">
                        <div className="pos-products">
                            <input ref={searchRef} className="input" placeholder={t('sys.str_913')} value={search}
                                onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && filtered.length > 0) addToCart(filtered[0]); }}
                                style={{ marginBottom: '12px' }} />
                            {filtered.length > 0 ? filtered.map(p => (
                                <div key={p.id} className="pos-product-item" onClick={() => addToCart(p)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmt(p.buyPrice)} {t('purchases.str_975')}{p.currentStock}</div>
                                    </div>
                                    <span style={{ fontSize: '18px', color: 'var(--primary)' }}>+</span>
                                </div>
                            )) : search.trim() ? (
                                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        {t('purchases.str_976')}</div>
                                    <button className="btn btn-primary btn-sm" onClick={openAddProduct}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {t('sys.str_764')}</button>
                                </div>
                            ) : null}
                        </div>
                        <div className="pos-invoice">
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                                <button className={`btn ${!isManual ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsManual(false)} style={{ flex: 1, fontWeight: 'bold' }}>فاتورة المشتريات (القياسية)</button>
                                <button className={`btn ${isManual ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsManual(true)} style={{ flex: 1, fontWeight: 'bold' }} title="لا يؤثر على أسعار وتقييم المنتجات المخزنية">فاتورة المشتريات (اليدوية)</button>
                            </div>
                            
                            {isManual && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px' }}>إجمالي الفاتورة الصافي (قبل الضريبة)</label>
                                        <input className="input" type="number" value={manualSubtotal} onChange={e => setManualSubtotal(e.target.value)} placeholder="0.00" dir="ltr" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px' }}>مبلغ الضريبة</label>
                                        <input className="input" type="number" value={manualTaxValue} onChange={e => setManualTaxValue(e.target.value)} placeholder="0.00" dir="ltr" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        * في الفاتورة اليدوية، سيتم إضافة كميات الأصناف المدرجة في الجدول إلى المخزون (بدون قيمة محاسبية)، وذلك للتسوية والجرد. سيتم احتساب قيمة الفاتورة الكلية فقط في حساب المورد.
                                    </div>
                                </div>
                            )}
<div className="pos-invoice-header">
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <select className="input" style={{ width: '170px' }} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                                        <option value="">{t('purchases.str_977')}</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowAddSupplier(true)} title={t('purchases.str_1035')}
                                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700', minWidth: '34px' }}>+</button>
                                </div>
                                <select className="input" style={{ width: '130px' }} value={stockId} onChange={e => setStockId(e.target.value)}>
                                    <option value="1">{t('sys.str_753')}</option>
                                    {warehouses.filter(w => w.id !== 1).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                                <input className="input" style={{ width: '140px' }} placeholder={t('purchases.str_1036')} value={supplierInvoiceNo}
                                    onChange={e => setSupplierInvoiceNo(e.target.value)} dir="ltr" />
                                <select className="input" style={{ width: '130px' }} value={paymentType} onChange={e => { setPaymentType(e.target.value); if (e.target.value !== 'credit') setPaidAmount(''); }}>
                                    <option value="cash">{t('sys.str_754')}</option>
                                    <option value="card">{t('sys.str_755')}</option>
                                    <option value="transfer">{t('sys.str_756')}</option>
                                    <option value="credit">{t('purchases.str_978')}</option>
                                </select>
                            </div>
                            {paymentType === 'credit' && (
                                <div style={{ padding: '10px 16px', background: 'rgba(255,193,7,0.1)', borderBottom: '1px solid rgba(255,193,7,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--warning)' }}>{t('purchases.str_979')}</span>
                                    <input className="input" type="number" min="0" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                                        placeholder="0.00" dir="ltr" style={{ width: '130px', textAlign: 'center' }} />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('purchases.str_980')}</span>
                                </div>
                            )}
                            <div className="pos-invoice-table">
                                <table className="table">
                                    <thead><tr><th>{t('sys.str_63')}</th><th style={{ width: '80px' }}>{t('sys.str_64')}</th>{!isManual && <th style={{ width: '100px' }}>{t('sys.str_65')}</th>}{!isManual && <th style={{ width: '80px' }}>{t('sys.str_766')}</th>}{!isManual && <th style={{ width: '100px' }}>{t('sys.str_66')}</th>}<th style={{ width: '40px' }}></th></tr></thead>
                                    <tbody>
                                        {cart.length === 0 ? (
                                            <tr><td colSpan={6}><div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-icon">🛒</div><div className="empty-state-text">{t('purchases.str_981')}</div></div></td></tr>
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
                                    <div className="pos-total-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '4px' }}>
                                        <span>عداد الأصناف</span>
                                        <span style={{ fontWeight: 'normal', fontSize: '13px' }}>{totalItems} أصناف / {totalUnits} حبة</span>
                                    </div>
                                    <div className="pos-total-row"><span>{t('sys.str_947')}</span><span>{fmt(subtotal)} {t('sys.str_68')}</span></div>
                                    <div className="pos-total-row"><span>{t('purchases.str_982')}</span><span>{fmt(taxValue)} {t('sys.str_68')}</span></div>
                                    <div className="pos-total-row grand"><span>{t('sys.str_66')}</span><span style={{ color: 'var(--info-light)' }}>{fmt(total)} {t('sys.str_68')}</span></div>
                                    {paymentType === 'credit' && (
                                        <>
                                            <div className="pos-total-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '8px', marginTop: '4px' }}>
                                                <span style={{ color: 'var(--success)' }}>{t('purchases.str_983')}</span><span style={{ color: 'var(--success)' }}>{fmt(actualPaid)} {t('sys.str_68')}</span>
                                            </div>
                                            <div className="pos-total-row">
                                                <span style={{ color: 'var(--warning)' }}>{t('purchases.str_984')}</span><span style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '16px' }}>{fmt(remaining)} {t('sys.str_68')}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="pos-actions">
                                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || cart.length === 0}>{saving ? '⏳' : '💾'} {t('fin.str_205')}</button>
                                    <button className="btn btn-ghost" onClick={() => { setCart([]); setNotes(''); setPaidAmount(''); }}>{t('sys.str_742')}</button>
                                </div>
                                <div style={{ marginTop: '12px' }}><input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('sys.str_955')} /></div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'pending' ? (
                    /* Pending Invoices Tab */
                    <div className="card">
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>{t('purchases.str_985')}{pendingInvoices.length})</h2>
                            <div style={{ fontSize: '14px', color: 'var(--warning)', fontWeight: '600' }}>
                                {t('purchases.str_986')}{fmt(pendingInvoices.reduce((s, inv) => s + inv.remaining, 0))} {t('sys.str_68')}</div>
                        </div>
                        {pendingInvoices.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-text">{t('purchases.str_987')}</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>{t('sys.str_510')}</th>
                                            <th>{t('fin.str_232')}</th>
                                            <th>{t('sys.str_953')}</th>
                                            <th>{t('sys.str_66')}</th>
                                            <th>{t('purchases.str_988')}</th>
                                            <th>{t('purchases.str_989')}</th>
                                            <th style={{ width: '200px' }}>{t('purchases.str_990')}</th>
                                            {canDelete && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingInvoices.map(inv => (
                                            <tr key={inv.id}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo} {inv.isManual && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginRight: '4px' }}>يدوي</span>}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                                                <td>{inv.supplier?.name || t('purchases.str_1037')}</td>
                                                <td>{fmt(inv.total)} {t('sys.str_68')}</td>
                                                <td style={{ color: 'var(--success)' }}>{fmt(inv.paid)} {t('sys.str_68')}</td>
                                                <td style={{ color: 'var(--warning)', fontWeight: '700' }}>{fmt(inv.remaining)} {t('sys.str_68')}</td>
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
                                                            {t('purchases.str_991')}</button>
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
                            <h2 style={{ margin: 0, fontSize: '18px' }}>{t('purchases.str_992')}{pendingReceipts.length})</h2>
                        </div>
                        {pendingReceipts.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-text">{t('purchases.str_993')}</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>{t('sys.str_510')}</th>
                                            <th>{t('fin.str_232')}</th>
                                            <th>{t('sys.str_953')}</th>
                                            <th>{t('sys.str_66')}</th>
                                            <th>{t('sys.str_795')}</th>
                                            <th>{t('purchases.str_994')}</th>
                                            <th style={{ width: '150px' }}>{t('sys.str_410')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingReceipts.map(inv => (
                                            <tr key={inv.id}>
                                                <td style={{ fontWeight: '700' }}>#{inv.invoiceNo} {inv.isManual && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', marginRight: '4px' }}>يدوي</span>}</td>
                                                <td>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                                                <td>{inv.supplier?.name || t('purchases.str_1037')}</td>
                                                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(inv.total)} {t('sys.str_68')}</td>
                                                <td>{inv.paymentType === 'cash' ? t('sys.str_860') : inv.paymentType === 'transfer' ? t('sys.str_862') : inv.paymentType === 'card' ? t('sys.str_861') : t('sys.str_863')}</td>
                                                <td><span style={{ padding: '4px 8px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}>{t('purchases.str_995')}</span></td>
                                                <td>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        onClick={() => handleReceiveGoods(inv.id)} disabled={receivingId === inv.id}>
                                                        {receivingId === inv.id ? '⏳' : t('purchases.str_1038')}
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
                            <h3>{t('purchases.str_996')}</h3>
                            <button className="modal-close" onClick={() => setShowAddSupplier(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input className="input" placeholder={t('purchases.str_1039')} value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} autoFocus />
                            <input className="input" placeholder={t('sys.str_855')} value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} dir="ltr" />
                            <input className="input" placeholder={t('sys.str_529')} value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} dir="ltr" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder={t('sys.str_537')} value={newSupplier.street} onChange={e => setNewSupplier({ ...newSupplier, street: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_538')} value={newSupplier.buildingNumber} onChange={e => setNewSupplier({ ...newSupplier, buildingNumber: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder={t('sys.str_536')} value={newSupplier.district} onChange={e => setNewSupplier({ ...newSupplier, district: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_528')} value={newSupplier.city} onChange={e => setNewSupplier({ ...newSupplier, city: e.target.value })} />
                                <input className="input" placeholder={t('sys.str_539')} value={newSupplier.postalCode} onChange={e => setNewSupplier({ ...newSupplier, postalCode: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" type="number" placeholder={t('sys.str_540')} value={newSupplier.creditLimit} onChange={e => setNewSupplier({ ...newSupplier, creditLimit: e.target.value })} dir="ltr" />
                                <input className="input" placeholder={t('sys.str_465')} value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddSupplier(false)}>{t('fin.str_206')}</button>
                            <button className="btn btn-primary" onClick={saveNewSupplier} disabled={savingSupplier || !newSupplier.name.trim()}>
                                {savingSupplier ? t('sys.str_852') : t('sys.str_455')}
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
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('purchases.str_997')}</label>
                                    <input className="input" type="number" placeholder="0.00" value={newProd.buyPrice} onChange={e => setNewProd({ ...newProd, buyPrice: e.target.value })} dir="ltr" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_877')}</label>
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
                            <button className="btn btn-primary" onClick={saveNewProduct} disabled={savingProd || !newProd.name.trim()}>
                                {savingProd ? t('sys.str_852') : t('purchases.str_1040')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Invoice Reader Workspace (Matches Screenshot) */}
            {showOcrModal && ocrData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f0f2f5', zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    
                    {/* Top Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '24px', color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span>📋</span> Queue</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span>🔌</span> {t('purchases.str_998')}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#3b82f6', fontWeight: '600' }}><span>🤖</span> {t('purchases.str_999')}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span>🧠</span> {t('purchases.str_1000')}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span>🕒</span> {t('purchases.str_1001')}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span>📥</span> {t('purchases.str_1002')}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderRight: '1px solid #e2e8f0', paddingRight: '24px' }}>{t('purchases.str_1003')}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                0%
                                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '0%', height: '100%', background: '#10b981' }}></div>
                                </div>
                            </div>
                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                                {t('purchases.str_1004')}</button>
                            <button onClick={() => setShowOcrModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#ef4444', cursor: 'pointer', marginLeft: '12px' }}>✕</button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '20px', gap: '24px' }}>
                        
                        {/* Left Side: Image Viewer */}
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Toolbar for image */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' }}>↻</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' }}>↺</button>
                                    <div style={{ width: '1px', background: '#cbd5e1', margin: '0 4px' }}></div>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' }}>⛶</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' }}>🔍+</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' }}>🔍-</button>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '4px' }}>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: 'none', background: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#475569' }}>⏭</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: 'none', background: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#475569' }}>▶</button>
                                    <span style={{ fontSize: '14px', padding: '0 16px', color: '#475569', fontWeight: '500', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{t('purchases.str_1005')}</span>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: 'none', background: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#475569' }}>◀</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: 'none', background: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#475569' }}>⏮</button>
                                </div>
                            </div>
                            
                            {/* Image Canvas */}
                            <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {ocrFileType.includes('pdf') ? (
                                    <iframe src={ocrImagePreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                                ) : (
                                    <img src={ocrImagePreviewUrl} alt="Invoice" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                )}
                            </div>
                        </div>

                        {/* Right Side: Data Form */}
                        <div style={{ width: '450px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', padding: '6px 12px', borderRadius: '20px' }}>
                                    {t('purchases.str_1006')}</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>🗑</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: '1px solid #e2e8f0', background: '#fff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>📄</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ border: '1px solid #e2e8f0', background: '#fff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>🔄</button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <h2 style={{ textAlign: 'center', color: '#3b82f6', marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>{t('purchases.str_1007')}</h2>
                                
                                <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <span>▼</span>
                                    <span>{t('purchases.str_1008')}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {/* اسم المورد */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <input className="input" defaultValue={ocrData.supplierName || ''} onChange={e => setOcrData({ ...ocrData, supplierName: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }} />
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           <span style={{ color: '#ef4444' }}>*</span> {t('purchases.str_1009')}<span style={{ fontSize: '16px' }}>🏢</span>
                                        </div>
                                    </div>

                                    {/* الرقم الضريبي */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <input className="input" defaultValue={ocrData.taxNumber || ''} onChange={e => setOcrData({ ...ocrData, taxNumber: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }} dir="ltr" />
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           <span style={{ color: '#ef4444' }}>*</span> {t('sys.str_529')}<span style={{ fontSize: '16px', color: '#0ea5e9' }}>🧾</span>
                                        </div>
                                    </div>

                                    {/* رقم الفاتورة */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <input className="input" defaultValue={ocrData.invoiceNo || ''} onChange={e => setOcrData({ ...ocrData, invoiceNo: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }} dir="ltr" />
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           <span style={{ color: '#ef4444' }}>*</span> {t('sys.str_510')}<span style={{ fontSize: '16px' }}>📑</span>
                                        </div>
                                    </div>

                                    {/* تاريخ الفاتورة */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <input className="input" type="date" defaultValue={ocrData.date || ''} onChange={e => setOcrData({ ...ocrData, date: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }} dir="ltr" />
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           <span style={{ color: '#ef4444' }}>*</span> {t('purchases.str_1010')}<span style={{ fontSize: '16px', color: '#3b82f6' }}>📅</span>
                                        </div>
                                    </div>

                                    {/* تاريخ الاستحقاق */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <input className="input" type="date" defaultValue={ocrData.dueDate || ''} onChange={e => setOcrData({ ...ocrData, dueDate: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }} dir="ltr" />
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           {t('sys.str_666')}<span style={{ fontSize: '16px', color: '#ef4444' }}>⏰</span>
                                        </div>
                                    </div>

                                    {/* العملة */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                           <select className="input" defaultValue={ocrData.currency || 'SAR'} onChange={e => setOcrData({ ...ocrData, currency: e.target.value })} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'right', width: '100%', padding: '10px' }}>
                                              <option value="SAR">{t('purchases.str_1011')}</option>
                                              <option value="USD">{t('purchases.str_1012')}</option>
                                           </select>
                                        </div>
                                        <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '14px', color: '#475569' }}>
                                           {t('purchases.str_1013')}<span style={{ fontSize: '16px', color: '#0ea5e9' }}>💵</span>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}>
                                    {t('purchases.str_1014')}{ocrData.items?.length || 0}) <span>📄</span>
                                </button>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
                                    <button onClick={() => setShowOcrModal(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}>
                                        {t('purchases.str_1015')}<span>🗑</span>
                                    </button>
                                    <button onClick={confirmOcrData} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                                        {t('purchases.str_1016')}<span>💾</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
