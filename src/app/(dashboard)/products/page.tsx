'use client';

import { useState, useEffect, useRef } from 'react';

interface Product {
    id: number;
    name: string;
    barcode: string;
    categoryId: number;
    unitId: number;
    buyPrice: number;
    sellPrice: number;
    taxRate: number;
    minQuantity: number;
    currentStock: number;
    description: string;
    nameEn: string;
    imagePath: string;
    brandAr: string;
    sizeInfo: string;
    active: boolean;
    sellByWeight: boolean;
    expiryDate?: string | null;
    binLocation?: string | null;
    category?: { id: number; name: string };
    unit?: { id: number; name: string };
    productStocks?: any[];
}

interface Category {
    id: number;
    name: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 50;
    const [showInactive, setShowInactive] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [form, setForm] = useState({
        name: '', barcode: '', categoryId: '', unitId: '1',
        buyPrice: '', sellPrice: '', taxRate: '15', minQuantity: '0',
        currentStock: '0', description: '', nameEn: '', sellByWeight: false,
        addVat: true, expiryDate: '', binLocation: ''
    });
    const [canResetStock, setCanResetStock] = useState(false);
    const [canDeleteProduct, setCanDeleteProduct] = useState(false);
    const [toast, setToast] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSavingCategory(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            if (res.ok) {
                const created = await res.json();
                await fetchCategories();
                setForm(f => ({ ...f, categoryId: created.id.toString() }));
                setNewCategoryName('');
                setShowAddCategory(false);
            }
        } catch (err) { console.error(err); }
        finally { setSavingCategory(false); }
    };

    useEffect(() => {
        fetchProducts(); fetchCategories();
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
            setCanResetStock(u.role === 'admin' || perms.includes('reset_stock'));
            setCanDeleteProduct(u.role === 'admin' || perms.includes('delete_products'));
        } catch { }
    }, []);

    async function fetchProducts() {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (categoryFilter) params.set('category_id', categoryFilter);
            if (showInactive) params.set('include_inactive', 'true');
            const res = await fetch(`/api/products?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setProducts(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setCategories(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        setPage(1);
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [search, categoryFilter, showInactive]);

    const openAdd = () => {
        setEditProduct(null);
        setForm({
            name: '', barcode: '', categoryId: '', unitId: '1',
            buyPrice: '', sellPrice: '', taxRate: '15', minQuantity: '0',
            currentStock: '0', description: '', nameEn: '', sellByWeight: false,
            addVat: true, expiryDate: '', binLocation: ''
        });
        setShowModal(true);
    };

    const openEdit = (p: Product) => {
        setEditProduct(p);
        setForm({
            name: p.name, barcode: p.barcode || '', categoryId: p.categoryId?.toString() || '',
            unitId: p.unitId?.toString() || '1', buyPrice: p.buyPrice?.toString() || '',
            sellPrice: p.sellPrice?.toString() || '', taxRate: p.taxRate?.toString() || '15',
            minQuantity: p.minQuantity?.toString() || '0', currentStock: p.currentStock?.toString() || '0',
            description: p.description || '', nameEn: p.nameEn || '', sellByWeight: p.sellByWeight || false,
            addVat: true, expiryDate: p.expiryDate || '', binLocation: p.binLocation || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
        const method = editProduct ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) { setShowModal(false); fetchProducts(); }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف جميع البيانات المرتبطة به.')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ ${data.message || 'تم حذف المنتج'}`);
                fetchProducts();
            } else {
                showToast(`❌ ${data.error || 'فشل في الحذف'}`);
            }
        } catch (err) { console.error(err); showToast('❌ خطأ في الاتصال بالسيرفر'); }
    };

    const handleRestore = async (id: number) => {
        if (!confirm('هل تريد استعادة وتفعيل هذا المنتج؟')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ active: true }),
            });
            if (res.ok) {
                showToast('✅ تم استعادة وتفعيل المنتج بنجاح');
                fetchProducts();
            } else {
                showToast('❌ فشل في الاستعادة');
            }
        } catch (err) { console.error(err); showToast('❌ خطأ في الاتصال بالسيرفر'); }
    };

    const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(v);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
    
    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products/export', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('✅ تم التصدير بنجاح');
            } else {
                showToast('❌ فشل تصدير البيانات');
            }
        } catch (err) {
            console.error('Export error:', err);
            showToast('❌ حدث خطأ أثناء التصدير');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products/import', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ ${data.message || 'تم الاستيراد بنجاح'}`);
                fetchProducts();
            } else {
                showToast(`❌ ${data.error || 'فشل الاستيراد'}`);
            }
        } catch (err) {
            console.error('Import error:', err);
            showToast('❌ حدث خطأ أثناء الاستيراد');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleResetStock = async () => {
        if (!confirm('⚠️ هل أنت متأكد من تصفير مخزون جميع المنتجات؟')) return;
        if (!confirm('تأكيد نهائي: سيتم تصفير مخزون كل المنتجات إلى صفر. لا يمكن التراجع!')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); fetchProducts(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل'}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const handleDeleteAllProducts = async () => {
        if (!confirm('⚠️ هل أنت متأكد من حذف أو أرشفة جميع المنتجات؟')) return;
        if (!confirm('تأكيد نهائي: سيتم حذف جميع المنتجات التي ليس لها حركات مالية، وسيتم أرشفة الباقي. استمر؟')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); fetchProducts(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل الحذف'}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const paginatedProducts = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(products.length / PER_PAGE);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📦 المنتجات</h1>
                <span className="badge badge-info">{products.length} منتج</span>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar">
                        <input
                            className="input"
                            placeholder="🔍 بحث بالاسم أو الباركود..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="input" style={{ width: '180px' }}
                        value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">كل التصنيفات</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="toolbar-spacer" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginRight: '12px' }}>
                        <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                        عرض المؤرشفة (المحذوفة)
                    </label>
                    <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleImport} />
                    <button className="btn" onClick={handleExport} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>📤 تصدير لإكسيل</button>
                    <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }} disabled={isImporting}>
                        {isImporting ? '⏳ جاري الاستيراد...' : '📥 استيراد منتجات'}
                    </button>
                    {canResetStock && <button className="btn" onClick={handleResetStock} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>🔄 تصفير المخزون</button>}
                    {canDeleteProduct && <button className="btn" onClick={handleDeleteAllProducts} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>🗑️ حذف كل المنتجات</button>}
                    <button className="btn btn-primary" onClick={openAdd}>➕ إضافة منتج</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الصورة</th>
                                <th>الاسم</th>
                                <th>الباركود</th>
                                <th>التصنيف</th>
                                <th>سعر الشراء</th>
                                <th>سعر الشراء + الضريبة</th>
                                <th>سعر البيع</th>
                                <th>المخزون</th>
                                <th>الموقع/الرف</th>
                                <th>انتهاء الصلاحية</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            ) : paginatedProducts.length === 0 ? (
                                <tr><td colSpan={10}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📦</div>
                                        <div className="empty-state-text">لا توجد منتجات</div>
                                    </div>
                                </td></tr>
                            ) : paginatedProducts.map((p, i) => (
                                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6, background: !p.active ? 'rgba(239,68,68,0.05)' : undefined }}>
                                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                                    <td>
                                        {p.imagePath ? (
                                            <img
                                                src={p.imagePath}
                                                alt={p.name}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg-card-hover)',
                                                }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '8px',
                                                background: 'var(--bg-card-hover)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '20px', border: '1px solid var(--border)',
                                            }}>📦</div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {p.name}
                                            {!p.active && <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>مؤرشف</span>}
                                        </div>
                                        {p.nameEn && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.nameEn}</div>}
                                        {p.brandAr && <div style={{ fontSize: '11px', color: 'var(--purple)' }}>{p.brandAr} {p.sizeInfo ? `• ${p.sizeInfo}` : ''}</div>}
                                    </td>
                                    <td><code style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{p.barcode || '-'}</code></td>
                                    <td>{p.category?.name || '-'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.buyPrice)} ر.س</td>
                                    <td style={{ fontWeight: '600', color: 'var(--warning, #f59e0b)' }}>{formatCurrency(p.buyPrice * 1.15)} ر.س</td>
                                    <td style={{ fontWeight: '600', color: 'var(--success-light)' }}>{formatCurrency(p.sellPrice)} ر.س</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className={`badge ${p.currentStock <= p.minQuantity ? 'badge-danger' : 'badge-success'}`}>
                                                الإجمالي: {p.currentStock} {p.unit?.name || ''}
                                            </span>
                                            {p.productStocks && p.productStocks.length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {p.productStocks.map((ps: any) => (
                                                        <div key={ps.stock?.id || Math.random()}>• {ps.stock?.name}: <span style={{fontWeight:'bold'}}>{ps.quantity}</span></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td><span style={{ fontSize: '12px', fontWeight: 'bold' }}>{p.binLocation || '-'}</span></td>
                                    <td>
                                        {p.expiryDate ? <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.expiryDate}</span> : <span style={{ color: '#ccc' }}>-</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                                            {canDeleteProduct && p.active && <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }} title="حذف أو أرشفة">🗑️</button>}
                                            {canDeleteProduct && !p.active && <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(p.id)} style={{ color: 'var(--success)' }} title="استعادة المنتج">♻️</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>◀️ السابق</button>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            صفحة {page} من {totalPages} ({products.length} منتج)
                        </span>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي ▶️</button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editProduct ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="grid-2">
                            <div className="input-group">
                                <label className="input-label">اسم المنتج *</label>
                                <input className="input" value={form.name} onChange={e => {
                                    const val = e.target.value;
                                    setForm(f => ({ ...f, name: val }));
                                    // Auto-transliterate to English
                                    if (val.trim()) {
                                        fetch('/api/transliterate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val }) })
                                            .then(r => r.json())
                                            .then(d => { if (d.result) setForm(f => ({ ...f, nameEn: d.result })); })
                                            .catch(() => {});
                                    } else {
                                        setForm(f => ({ ...f, nameEn: '' }));
                                    }
                                }} placeholder="اسم المنتج بالعربي" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">الاسم بالإنجليزي</label>
                                <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} placeholder="Product Name" dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">الباركود</label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input className="input" style={{ flex: 1 }} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="رقم الباركود" dir="ltr" />
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/settings');
                                                const data = await res.json();
                                                const settings = Array.isArray(data) ? data : [];
                                                const nbSetting = settings.find((s: {key:string}) => s.key === 'next_barcode');
                                                const nextBarcode = nbSetting ? parseInt(nbSetting.value, 10) : 1000;
                                                setForm(f => ({ ...f, barcode: String(nextBarcode) }));
                                            } catch { setForm(f => ({ ...f, barcode: '1000' })); }
                                        }}
                                        title="توليد باركود تلقائي"
                                        style={{ whiteSpace: 'nowrap', minWidth: '36px', padding: '6px 10px', fontSize: '14px' }}
                                    >
                                        🔢 توليد
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">التصنيف</label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <select className="input" style={{ flex: 1 }} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                                        <option value="">بدون تصنيف</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => { setShowAddCategory(!showAddCategory); setNewCategoryName(''); }}
                                        title="إضافة صنف جديد"
                                        style={{ minWidth: '36px', padding: '6px 10px', fontSize: '16px', borderRadius: '8px' }}
                                    >
                                        {showAddCategory ? '✕' : '➕'}
                                    </button>
                                </div>
                                {showAddCategory && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                                        <input
                                            className="input"
                                            style={{ flex: 1 }}
                                            placeholder="اسم الصنف الجديد..."
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={handleAddCategory}
                                            disabled={savingCategory || !newCategoryName.trim()}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            {savingCategory ? '⏳' : '✅ حفظ'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">سعر الشراء</label>
                                <input className="input" type="number" step="0.01" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} placeholder="0.00" dir="ltr" />
                                {form.addVat && form.buyPrice && (
                                    <div style={{ fontSize: '12px', color: 'var(--success-light)', marginTop: '4px', fontWeight: '600' }}>
                                        💰 شامل الضريبة: {(parseFloat(form.buyPrice) * (1 + (parseFloat(form.taxRate) || 15) / 100)).toFixed(2)} ر.س
                                    </div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">سعر البيع</label>
                                <input className="input" type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} placeholder="0.00" dir="ltr" />
                                {form.addVat && form.sellPrice && (
                                    <div style={{ fontSize: '12px', color: 'var(--success-light)', marginTop: '4px', fontWeight: '600' }}>
                                        💰 شامل الضريبة: {(parseFloat(form.sellPrice) * (1 + (parseFloat(form.taxRate) || 15) / 100)).toFixed(2)} ر.س
                                    </div>
                                )}
                            </div>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', padding: '10px 14px', borderRadius: '10px', background: form.addVat ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: form.addVat ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.addVat}
                                        onChange={e => setForm({ ...form, addVat: e.target.checked })}
                                        style={{ width: '20px', height: '20px', accentColor: '#22c55e' }}
                                    />
                                    <span style={{ fontWeight: '600' }}>✅ إضافة ضريبة القيمة المضافة ({form.taxRate}%) على سعر الشراء والبيع</span>
                                </label>
                            </div>
                            <div className="input-group">
                                <label className="input-label">نسبة الضريبة %</label>
                                <input className="input" type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">الحد الأدنى للمخزون</label>
                                <input className="input" type="number" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">المخزون الحالي</label>
                                <input className="input" type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">موقع الرف المخزني (Bin/Shelf)</label>
                                <input className="input" value={form.binLocation} onChange={e => setForm({ ...form, binLocation: e.target.value })} placeholder="مثال: A1-05" dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">تاريخ الانتهاء</label>
                                <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} dir="ltr" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">الوصف</label>
                            <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف المنتج (اختياري)" rows={2} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
