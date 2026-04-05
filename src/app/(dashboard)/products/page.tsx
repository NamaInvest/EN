'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Product {
    id: number;
    name: string;
    barcode: string;
    categoryId: number;
    unitId: number;
    buyPrice: number;
    sellPrice: number;
    taxRate: number;
    taxType?: string;
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
    productUnits?: any[];
}

interface Category {
    id: number;
    name: string;
}

export default function ProductsPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [formUnits, setFormUnits] = useState<any[]>([]);
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
    
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [savingUnit, setSavingUnit] = useState(false);

    const [form, setForm] = useState({
        name: '', barcode: '', categoryId: '', unitId: '1',
        buyPrice: '', sellPrice: '', taxRate: '15', taxType: 'VAT', minQuantity: '0',
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

    const handleAddUnit = async () => {
        if (!newUnitName.trim()) return;
        setSavingUnit(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newUnitName.trim() }),
            });
            if (res.ok) {
                await fetchUnits();
                setNewUnitName('');
                setShowAddUnit(false);
            }
        } catch (err) { console.error(err); }
        finally { setSavingUnit(false); }
    };

    useEffect(() => {
        fetchProducts(); fetchCategories(); fetchUnits();
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

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/units', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUnits(await res.json());
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
            addVat: true, expiryDate: '', binLocation: '', taxType: 'VAT'
        });
        setFormUnits([]);
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
            addVat: true, expiryDate: p.expiryDate || '', binLocation: p.binLocation || '', taxType: p.taxType || 'VAT'
        });
        setFormUnits(p.productUnits ? p.productUnits.map((u: any) => ({
            id: u.id, unitId: u.unitId?.toString(),
            barcode: u.barcode || '', sellPrice: u.sellPrice?.toString() || '0', 
            buyPrice: u.buyPrice?.toString() || '0', factor: u.factor?.toString() || '1'
        })) : []);
        setShowModal(true);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
        const method = editProduct ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, productUnits: formUnits }),
            });
            if (res.ok) { setShowModal(false); fetchProducts(); }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_896'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ ${data.message || t('sys.str_897')}`);
                fetchProducts();
            } else {
                showToast(`❌ ${data.error || t('sys.str_831')}`);
            }
        } catch (err) { console.error(err); showToast(t('sys.str_898')); }
    };

    const handleRestore = async (id: number) => {
        if (!confirm(t('sys.str_899'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ active: true }),
            });
            if (res.ok) {
                showToast(t('sys.str_900'));
                fetchProducts();
            } else {
                showToast(t('sys.str_901'));
            }
        } catch (err) { console.error(err); showToast(t('sys.str_898')); }
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
                showToast(t('sys.str_902'));
            } else {
                showToast(t('sys.str_903'));
            }
        } catch (err) {
            console.error('Export error:', err);
            showToast(t('sys.str_904'));
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
                showToast(`✅ ${data.message || t('sys.str_905')}`);
                fetchProducts();
            } else {
                showToast(`❌ ${data.error || t('sys.str_906')}`);
            }
        } catch (err) {
            console.error('Import error:', err);
            showToast(t('sys.str_907'));
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleResetStock = async () => {
        if (!confirm(t('sys.str_908'))) return;
        if (!confirm(t('sys.str_909'))) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); fetchProducts(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || t('sys.str_591')}`); }
        } catch { showToast(t('sys.str_419')); }
    };

    const handleDeleteAllProducts = async () => {
        if (!confirm(t('sys.str_910'))) return;
        if (!confirm(t('sys.str_911'))) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); fetchProducts(); }
            else { const d = await res.json(); showToast(`❌ ${d.error || t('sys.str_912')}`); }
        } catch { showToast(t('sys.str_419')); }
    };

    const paginatedProducts = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(products.length / PER_PAGE);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{t('sys.str_866')}</h1>
                <span className="badge badge-info">{products.length} {t('sys.str_867')}</span>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <div className="search-bar">
                        <input
                            className="input"
                            placeholder={t('sys.str_913')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="input" style={{ width: '180px' }}
                        value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">{t('sys.str_868')}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="toolbar-spacer" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginRight: '12px' }}>
                        <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                        {t('sys.str_869')}</label>
                    <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleImport} />
                    <button className="btn" onClick={handleExport} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>{t('sys.str_870')}</button>
                    <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }} disabled={isImporting}>
                        {isImporting ? '⏳ جاري الاستيراد...' : '📥 استيراد منتجات'}
                    </button>
                    {canResetStock && <button className="btn" onClick={handleResetStock} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_871')}</button>}
                    {canDeleteProduct && <button className="btn" onClick={handleDeleteAllProducts} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_872')}</button>}
                    <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_873')}</button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t('sys.str_874')}</th>
                                <th>{t('fin.str_198')}</th>
                                <th>{t('sys.str_857')}</th>
                                <th>{t('sys.str_875')}</th>
                                <th>{t('sys.str_785')}</th>
                                <th>{t('sys.str_876')}</th>
                                <th>{t('sys.str_877')}</th>
                                <th>{t('sys.str_878')}</th>
                                <th>{t('sys.str_879')}</th>
                                <th>{t('sys.str_880')}</th>
                                <th>{t('sys.str_435')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            ) : paginatedProducts.length === 0 ? (
                                <tr><td colSpan={10}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📦</div>
                                        <div className="empty-state-text">{t('sys.str_881')}</div>
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
                                            {!p.active && <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>{t('sys.str_882')}</span>}
                                        </div>
                                        {p.nameEn && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.nameEn}</div>}
                                        {p.brandAr && <div style={{ fontSize: '11px', color: 'var(--purple)' }}>{p.brandAr} {p.sizeInfo ? `• ${p.sizeInfo}` : ''}</div>}
                                    </td>
                                    <td><code style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{p.barcode || '-'}</code></td>
                                    <td>{p.category?.name || '-'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.buyPrice)} {t('sys.str_68')}</td>
                                    <td style={{ fontWeight: '600', color: 'var(--warning, #f59e0b)' }}>{formatCurrency(p.buyPrice * 1.15)} {t('sys.str_68')}</td>
                                    <td style={{ fontWeight: '600', color: 'var(--success-light)' }}>{formatCurrency(p.sellPrice)} {t('sys.str_68')}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className={`badge ${p.currentStock <= p.minQuantity ? 'badge-danger' : 'badge-success'}`}>
                                                {t('sys.str_71')}{p.currentStock} {p.unit?.name || ''}
                                            </span>
                                            {p.productStocks && p.productStocks.length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {p.productStocks.map((ps: any) => (
                                                        <div key={ps.stock?.id || Math.random()}>• {ps.stock?.name}: <span style={{fontWeight:'bold'}}>{ps.quantity}</span></div>
                                                    ))}
                                                </div>
                                            )}
                                            {p.productUnits && p.productUnits.length > 0 && (
                                                <div style={{ fontSize: '10.5px', color: 'var(--purple)', marginTop: '4px', background: 'rgba(139, 92, 246, 0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                    {p.productUnits.map((u: any) => (
                                                        <div key={u.id}>📦 {u.unit?.name || 'وحدة'} = {u.factor} حبة <span style={{fontWeight:'bold', color:'var(--text)'}}>({Math.floor(p.currentStock / (u.factor || 1))} متاح)</span></div>
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
                                            {canDeleteProduct && p.active && <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }} title={t('sys.str_916')}>🗑️</button>}
                                            {canDeleteProduct && !p.active && <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(p.id)} style={{ color: 'var(--success)' }} title={t('sys.str_917')}>♻️</button>}
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
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('sys.str_883')}</button>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {t('sys.str_884')}{page} {t('sys.str_885')}{totalPages} ({products.length} {t('sys.str_886')}</span>
                        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t('sys.str_887')}</button>
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
                                <label className="input-label">{t('sys.str_856')}</label>
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
                                }} placeholder={t('sys.str_919')} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_888')}</label>
                                <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} placeholder="Product Name" dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_857')}</label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input className="input" style={{ flex: 1 }} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder={t('sys.str_400')} dir="ltr" />
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
                                        title={t('sys.str_920')}
                                        style={{ whiteSpace: 'nowrap', minWidth: '36px', padding: '6px 10px', fontSize: '14px' }}
                                    >
                                        {t('sys.str_401')}</button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_875')}</label>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <select className="input" style={{ flex: 1 }} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                                        <option value="">{t('sys.str_889')}</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => { setShowAddCategory(!showAddCategory); setNewCategoryName(''); }}
                                        title={t('sys.str_921')}
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
                                            placeholder={t('sys.str_922')}
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
                                <label className="input-label">{t('sys.str_785')}</label>
                                <input className="input" type="number" step="0.01" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} placeholder="0.00" dir="ltr" />
                                {form.addVat && form.buyPrice && (
                                    <div style={{ fontSize: '12px', color: 'var(--success-light)', marginTop: '4px', fontWeight: '600' }}>
                                        {t('sys.str_890')}{(parseFloat(form.buyPrice) * (1 + (parseFloat(form.taxRate) || 15) / 100)).toFixed(2)} {t('sys.str_68')}</div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_877')}</label>
                                <input className="input" type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} placeholder="0.00" dir="ltr" />
                                {form.addVat && form.sellPrice && (
                                    <div style={{ fontSize: '12px', color: 'var(--success-light)', marginTop: '4px', fontWeight: '600' }}>
                                        {t('sys.str_890')}{(parseFloat(form.sellPrice) * (1 + (parseFloat(form.taxRate) || 15) / 100)).toFixed(2)} {t('sys.str_68')}</div>
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
                                    <span style={{ fontWeight: '600' }}>{t('sys.str_891')}{form.taxRate}% {form.taxType}</span>
                                </label>
                            </div>
                            <div className="input-group">
                                <label className="input-label">نوع ونسبة الضريبة التشغيلية (Global Tax)</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <select className="input" style={{ flex: 1 }} value={form.taxType} onChange={e => setForm({ ...form, taxType: e.target.value })}>
                                        <option value="VAT">قيمة مضافة (ZATCA/EU VAT)</option>
                                        <option value="GST">سلع وخدمات (Asia GST)</option>
                                        <option value="SALES_TAX">المبيعات (US Sales Tax)</option>
                                        <option value="NONE">معفي (Exempt)</option>
                                    </select>
                                    <input className="input" style={{ width: '80px' }} type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_893')}</label>
                                <input className="input" type="number" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_894')}</label>
                                <input className="input" type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_895')}</label>
                                <input className="input" value={form.binLocation} onChange={e => setForm({ ...form, binLocation: e.target.value })} placeholder={t('sys.str_924')} dir="ltr" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_432')}</label>
                                <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} dir="ltr" />
                            </div>
                        </div>

                        <div className="input-group" style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card-hover)', marginTop: '16px', gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label className="input-label" style={{ margin: 0, fontSize: '16px', color: 'var(--primary)' }}>📦 الوحدات المتعددة (كرتون، درزن.. الخ)</label>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddUnit(!showAddUnit)}>{showAddUnit ? '✕ إلغاء' : '🛠️ إنشاء أسم وحدة جديدة'}</button>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormUnits([...formUnits, { unitId: '', barcode: '', sellPrice: '', factor: '12' }])}>➕ إضافة تعبئة للصنف</button>
                            </div>
                            
                            {showAddUnit && (
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <input
                                        className="input"
                                        style={{ flex: 1 }}
                                        placeholder="مثال: طبلية، باكيت، شدة..."
                                        value={newUnitName}
                                        onChange={e => setNewUnitName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
                                        autoFocus
                                    />
                                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAddUnit} disabled={savingUnit || !newUnitName.trim()} style={{ whiteSpace: 'nowrap' }}>
                                        {savingUnit ? '⏳' : '✅ حفظ اسم الوحدة بالقاموس'}
                                    </button>
                                </div>
                            )}

                            {formUnits.length === 0 ? <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>لا توجد وحدات إضافية لهذا الصنف (المخزون يحسب بالوحدة الأساسية فقط)</div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {formUnits.map((fu, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', alignItems: 'end', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>إسم الوحدة (كرتون..)</label>
                                                <select className="input" style={{ width: '100%', padding: '6px' }} value={fu.unitId} onChange={e => {
                                                    const newArr = [...formUnits]; newArr[idx].unitId = e.target.value; setFormUnits(newArr);
                                                }}>
                                                    <option value="">-- اختر --</option>
                                                    {units.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>تعادل كم حبة أساسية؟</label>
                                                <input className="input" type="number" style={{ width: '100%', padding: '6px' }} placeholder="12" value={fu.factor} onChange={e => {
                                                    const newArr = [...formUnits]; newArr[idx].factor = e.target.value; setFormUnits(newArr);
                                                }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>سعر البيع</label>
                                                <input className="input" type="number" step="0.01" style={{ width: '100%', padding: '6px' }} value={fu.sellPrice} onChange={e => {
                                                    const newArr = [...formUnits]; newArr[idx].sellPrice = e.target.value; setFormUnits(newArr);
                                                }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>الباركود المخصص</label>
                                                <input className="input" style={{ width: '100%', padding: '6px' }} value={fu.barcode} onChange={e => {
                                                    const newArr = [...formUnits]; newArr[idx].barcode = e.target.value; setFormUnits(newArr);
                                                }} />
                                            </div>
                                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', height: '36px', minWidth: '40px' }} onClick={() => {
                                                const newArr = formUnits.filter((_, i) => i !== idx); setFormUnits(newArr);
                                            }}>🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('fin.str_212')}</label>
                            <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('sys.str_925')} rows={2} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleSave}>{t('sys.str_455')}</button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div></div>}
        </>
    );
}
