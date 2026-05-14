'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import ProductFormModal from './components/ProductFormModal';

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
  const { error: toastError, success: toastSuccess } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;
  const [showInactive, setShowInactive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const [canResetStock, setCanResetStock] = useState(false);
  const [canDeleteProduct, setCanDeleteProduct] = useState(false);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchUnits();
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
      setCanResetStock(u.role === 'admin' || perms.includes('reset_stock'));
      setCanDeleteProduct(u.role === 'admin' || perms.includes('delete_products'));
    } catch { }
    const DEFAULT_HIDDEN = ['btn_reset_stock', 'btn_delete_all_products', 'btn_delete_all_categories'];
    fetch('/api/settings/hidden_modules').then(r => r.ok ? r.json() : { value: '' }).then(d => {
      try {
        const saved: string[] = d.value ? JSON.parse(d.value) : [];
        const merged = [...new Set([...DEFAULT_HIDDEN.filter(k => !saved.includes('SHOW_' + k)), ...saved])];
        setHiddenModules(merged);
      } catch { setHiddenModules(DEFAULT_HIDDEN); }
    }).catch(() => setHiddenModules(DEFAULT_HIDDEN));
  }, []);

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category_id', categoryFilter);
      if (showInactive) params.set('include_inactive', 'true');
      params.set('page', page.toString());
      params.set('limit', PER_PAGE.toString());
      const res = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts(await res.json());
        const tc = res.headers.get('X-Total-Count');
        if (tc) setTotalCount(parseInt(tc, 10));
        else setTotalCount(0);
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCategories(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
  };

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/units', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUnits(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, showInactive, page]);

  const openAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setShowModal(true);
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
        toastSuccess(`✅ ${data.message || t('sys.str_897')}`);
        fetchProducts();
      } else {
        toastError(`❌ ${data.error || t('sys.str_831')}`);
      }
    } catch (err) { toastError(t('sys.str_898')); }
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
        toastSuccess(t('sys.str_900'));
        fetchProducts();
      } else {
        toastError(t('sys.str_901'));
      }
    } catch (err) { toastError(t('sys.str_898')); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(v);
  
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
        toastSuccess(t('sys.str_902'));
      } else {
        toastError(t('sys.str_903'));
      }
    } catch (err) { toastError(t('sys.str_904')); }
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
        toastSuccess(`✅ ${data.message || t('sys.str_905')}`);
        fetchProducts();
      } else {
        toastError(`❌ ${data.error || t('sys.str_906')}`);
      }
    } catch (err) {
      toastError(t('sys.str_907'));
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
      if (res.ok) { const d = await res.json(); toastSuccess(`✅ ${d.message}`); fetchProducts(); }
      else { const d = await res.json(); toastError(`❌ ${d.error || t('sys.str_591')}`); }
    } catch { toastError(t('sys.str_419')); }
  };

  const handleDeleteAllProducts = async () => {
    if (!confirm(t('sys.str_910'))) return;
    if (!confirm(t('sys.str_911'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/products?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); toastSuccess(`✅ ${d.message}`); fetchProducts(); }
      else { const d = await res.json(); toastError(`❌ ${d.error || t('sys.str_912')}`); }
    } catch { toastError(t('sys.str_419')); }
  };

  const handleDeleteAllCategories = async () => {
    if (!confirm('هل أنت متأكد من رغبتك بحذف جميع التصنيفات؟')) return;
    if (!confirm('تأكيد نهائي: بمجرد الحذف لا يمكن التراجع!')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/categories?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); toastSuccess(`✅ ${d.message}`); fetchCategories(); }
      else { const d = await res.json(); toastError(`❌ ${d.error || 'حدث خطأ'}`); }
    } catch { toastError('فشل في الاتصال'); }
  };

  const paginatedProducts = products;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_866')}</h1>
        <span className="badge badge-info">{totalCount} {t('sys.str_867')}</span>
      </div>
      <div className="page-content animate-fade-in">
        <div className="toolbar">
          <div className="search-bar" style={{ minWidth: '340px', flex: '1', maxWidth: '520px' }}>
            <input
              className="input"
              style={{ width: '100%' }}
              placeholder={t('sys.str_913')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input" style={{ width: '180px' }}
            value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">{t('sys.str_868')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="toolbar-spacer" />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginRight: '12px' }}>
            <input type="checkbox" checked={showInactive} onChange={e => { setShowInactive(e.target.checked); setPage(1); }} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            {t('sys.str_869')}
          </label>
          <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleImport} />
          <button className="btn" onClick={handleExport} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>{t('sys.str_870')}</button>
          <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }} disabled={isImporting}>
            {isImporting ? t('sys.str_914') : t('sys.str_915')}
          </button>
          {canResetStock && !hiddenModules.includes('btn_reset_stock') && <button className="btn" onClick={handleResetStock} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_871')}</button>}
          {canDeleteProduct && !hiddenModules.includes('btn_delete_all_products') && <button className="btn" onClick={handleDeleteAllProducts} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_872')}</button>}
          {canDeleteProduct && !hiddenModules.includes('btn_delete_all_categories') && <button className="btn" onClick={handleDeleteAllCategories} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>حذف كل التصنيفات</button>}
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
                          width: '48px', height: '48px', objectFit: 'cover',
                          borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card-hover)',
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-card-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid var(--border)'
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
                            <div key={u.id}>📦 {u.unit?.name || t('sys.str_1910')} = {u.factor} {t('sys.str_813')}<span style={{fontWeight:'bold', color:'var(--text)'}}>({Math.floor(p.currentStock / (u.factor || 1))} {t('sys.str_4259')}</span></div>
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
              {t('sys.str_884')}{page} {t('sys.str_885')}{totalPages} ({totalCount} {t('sys.str_886')})</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t('sys.str_887')}</button>
          </div>
        )}
      </div>

      {showModal && (
        <ProductFormModal 
          editProduct={editProduct} 
          categories={categories} 
          units={units} 
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchProducts();
          }}
          fetchCategories={fetchCategories}
          fetchUnits={fetchUnits}
        />
      )}
    </>
  );
}
