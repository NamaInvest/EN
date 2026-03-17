'use client';

import { useState, useEffect } from 'react';

interface Product { id: number; name: string; costPrice: number; salePrice: number; }
interface Ingredient { id: number; rawProductId: number; quantity: number; estimatedCost: number; rawProduct?: Product; }
interface Recipe { id: number; name: string; finishedProductId: number; totalCost: number; isActive: boolean; finishedProduct?: Product; ingredients: Ingredient[]; _count?: { orders: number }; }
interface Order { id: number; orderNumber: string; recipeId: number; quantityToProduce: number; startDate: string; endDate: string | null; status: string; totalCost: number; notes: string | null; recipe?: Recipe; }

export default function ManufacturingPage() {
    const [tab, setTab] = useState<'recipes' | 'orders'>('recipes');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Recipe Modal
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
    const [recipeName, setRecipeName] = useState('');
    const [finishedProductId, setFinishedProductId] = useState('');
    const [ingredients, setIngredients] = useState<{ rawProductId: string; quantity: string; estimatedCost: string }[]>([]);

    // Order Modal
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderRecipeId, setOrderRecipeId] = useState('');
    const [orderQty, setOrderQty] = useState('1');
    const [orderNotes, setOrderNotes] = useState('');

    const [saving, setSaving] = useState(false);

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        try {
            const [rRes, oRes, pRes] = await Promise.all([
                fetch('/api/manufacturing/recipes', { headers: headers() }),
                fetch('/api/manufacturing/orders', { headers: headers() }),
                fetch('/api/products', { headers: headers() }),
            ]);
            if (rRes.ok) setRecipes(await rRes.json());
            if (oRes.ok) setOrders(await oRes.json());
            if (pRes.ok) { const d = await pRes.json(); setProducts(Array.isArray(d) ? d : d.products || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Recipe CRUD
    const openAddRecipe = () => {
        setEditRecipe(null); setRecipeName(''); setFinishedProductId('');
        setIngredients([{ rawProductId: '', quantity: '1', estimatedCost: '0' }]);
        setShowRecipeModal(true);
    };
    const openEditRecipe = (r: Recipe) => {
        setEditRecipe(r); setRecipeName(r.name); setFinishedProductId(r.finishedProductId.toString());
        setIngredients(r.ingredients.map(i => ({ rawProductId: i.rawProductId.toString(), quantity: i.quantity.toString(), estimatedCost: i.estimatedCost.toString() })));
        setShowRecipeModal(true);
    };
    const saveRecipe = async () => {
        if (!recipeName || !finishedProductId) { alert('اسم الوصفة والمنتج النهائي مطلوبان'); return; }
        const validIngredients = ingredients.filter(i => i.rawProductId);
        if (validIngredients.length === 0) { alert('أضف مكون واحد على الأقل'); return; }
        setSaving(true);
        try {
            const url = editRecipe ? `/api/manufacturing/recipes/${editRecipe.id}` : '/api/manufacturing/recipes';
            const method = editRecipe ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: headers(), body: JSON.stringify({ name: recipeName, finishedProductId, ingredients: validIngredients }) });
            if (res.ok) { setShowRecipeModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert('خطأ في الاتصال'); } finally { setSaving(false); }
    };
    const deleteRecipe = async (id: number) => {
        if (!confirm('حذف هذه الوصفة؟')) return;
        const res = await fetch(`/api/manufacturing/recipes/${id}`, { method: 'DELETE', headers: headers() });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };

    // Order CRUD
    const openAddOrder = () => { setOrderRecipeId(''); setOrderQty('1'); setOrderNotes(''); setShowOrderModal(true); };
    const saveOrder = async () => {
        if (!orderRecipeId || !orderQty) { alert('اختر الوصفة والكمية'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/manufacturing/orders', { method: 'POST', headers: headers(), body: JSON.stringify({ recipeId: orderRecipeId, quantityToProduce: orderQty, notes: orderNotes }) });
            if (res.ok) { setShowOrderModal(false); fetchData(); } else { const d = await res.json(); alert(d.error); }
        } catch { alert('خطأ'); } finally { setSaving(false); }
    };
    const updateOrderStatus = async (id: number, status: string) => {
        const res = await fetch(`/api/manufacturing/orders/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ status }) });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };
    const deleteOrder = async (id: number) => {
        if (!confirm('حذف هذا الأمر؟')) return;
        const res = await fetch(`/api/manufacturing/orders/${id}`, { method: 'DELETE', headers: headers() });
        if (res.ok) fetchData(); else { const d = await res.json(); alert(d.error); }
    };

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const statusLabels: Record<string, { label: string; cls: string }> = {
        draft: { label: '📝 مسودة', cls: 'badge-ghost' },
        in_progress: { label: '⚙️ قيد التنفيذ', cls: 'badge-warning' },
        completed: { label: '✅ مكتمل', cls: 'badge-success' },
        cancelled: { label: '❌ ملغي', cls: 'badge-error' }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🏭 التصنيع</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {tab === 'recipes' && <button className="btn btn-primary" onClick={openAddRecipe}>➕ وصفة جديدة</button>}
                    {tab === 'orders' && <button className="btn btn-primary" onClick={openAddOrder}>➕ أمر تصنيع</button>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setTab('recipes')} className="btn" style={{ flex: 1, background: tab === 'recipes' ? 'var(--primary-color)' : 'transparent', color: tab === 'recipes' ? '#fff' : 'var(--text-primary)', border: 'none', borderRadius: '10px' }}>📋 الوصفات ({recipes.length})</button>
                <button onClick={() => setTab('orders')} className="btn" style={{ flex: 1, background: tab === 'orders' ? 'var(--primary-color)' : 'transparent', color: tab === 'orders' ? '#fff' : 'var(--text-primary)', border: 'none', borderRadius: '10px' }}>📦 أوامر التصنيع ({orders.length})</button>
            </div>

            {/* Recipes Tab */}
            {tab === 'recipes' && (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>الوصفة</th><th>المنتج النهائي</th><th>عدد المكونات</th><th>التكلفة التقديرية</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : recipes.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-text">لا يوجد وصفات تصنيع</div></div></td></tr>
                                : recipes.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: '600' }}>{r.name}</td>
                                        <td>{r.finishedProduct?.name || '-'}</td>
                                        <td><span className="badge badge-outline">{r.ingredients.length} مكون</span></td>
                                        <td style={{ fontWeight: '600' }}>{fmt(r.totalCost)} ر.س</td>
                                        <td><span className={`badge ${r.isActive ? 'badge-success' : 'badge-ghost'}`}>{r.isActive ? 'نشطة' : 'متوقفة'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-sm btn-ghost" onClick={() => openEditRecipe(r)}>✏️</button>
                                                <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none' }} onClick={() => deleteRecipe(r.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th>رقم الأمر</th><th>الوصفة</th><th>المنتج</th><th>الكمية</th><th>التكلفة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : orders.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">لا يوجد أوامر تصنيع</div></div></td></tr>
                                : orders.map(o => (
                                    <tr key={o.id}>
                                        <td dir="ltr" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{o.orderNumber}</td>
                                        <td>{o.recipe?.name || '-'}</td>
                                        <td>{o.recipe?.finishedProduct?.name || '-'}</td>
                                        <td>{o.quantityToProduce}</td>
                                        <td style={{ fontWeight: '600' }}>{fmt(o.totalCost)} ر.س</td>
                                        <td><span className={`badge ${statusLabels[o.status]?.cls || ''}`}>{statusLabels[o.status]?.label || o.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {o.status === 'draft' && <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none', fontSize: '12px' }} onClick={() => updateOrderStatus(o.id, 'in_progress')}>▶ بدء</button>}
                                                {o.status === 'in_progress' && <button className="btn btn-sm" style={{ background: '#10b981', color: '#fff', border: 'none', fontSize: '12px' }} onClick={() => updateOrderStatus(o.id, 'completed')}>✅ إكمال</button>}
                                                {o.status !== 'completed' && <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', fontSize: '12px' }} onClick={() => deleteOrder(o.id)}>🗑️</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recipe Modal */}
            {showRecipeModal && (
                <div className="modal-overlay" onClick={() => setShowRecipeModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>{editRecipe ? '✏️ تعديل وصفة' : '➕ وصفة تصنيع جديدة'}</h3>
                            <button className="modal-close" onClick={() => setShowRecipeModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">اسم الوصفة *</label>
                                    <input className="input" value={recipeName} onChange={e => setRecipeName(e.target.value)} placeholder="مثال: تصنيع كرسي خشبي" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">المنتج النهائي *</label>
                                    <select className="input" value={finishedProductId} onChange={e => setFinishedProductId(e.target.value)}>
                                        <option value="">-- اختر المنتج --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label className="input-label" style={{ fontWeight: '700', fontSize: '15px' }}>🧱 المكونات (المواد الخام)</label>
                                    <button className="btn btn-sm btn-ghost" onClick={() => setIngredients([...ingredients, { rawProductId: '', quantity: '1', estimatedCost: '0' }])}>➕ أضف مكون</button>
                                </div>
                                {ingredients.map((ing, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <select className="input" style={{ flex: 2 }} value={ing.rawProductId} onChange={e => { const n = [...ingredients]; n[idx].rawProductId = e.target.value; const p = products.find(x => x.id === parseInt(e.target.value)); if (p) n[idx].estimatedCost = p.costPrice.toString(); setIngredients(n); }}>
                                            <option value="">-- المادة الخام --</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input className="input" style={{ flex: 1 }} type="number" placeholder="الكمية" value={ing.quantity} onChange={e => { const n = [...ingredients]; n[idx].quantity = e.target.value; setIngredients(n); }} />
                                        <input className="input" style={{ flex: 1 }} type="number" placeholder="التكلفة" value={ing.estimatedCost} onChange={e => { const n = [...ingredients]; n[idx].estimatedCost = e.target.value; setIngredients(n); }} />
                                        <button className="btn btn-sm" style={{ color: '#ef4444', border: 'none', background: 'transparent', padding: '4px' }} onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}>✕</button>
                                    </div>
                                ))}
                                <div style={{ textAlign: 'left', fontWeight: '700', marginTop: '10px', color: 'var(--primary-color)' }}>
                                    الإجمالي: {fmt(ingredients.reduce((s, i) => s + (parseFloat(i.estimatedCost) || 0) * (parseFloat(i.quantity) || 0), 0))} ر.س
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={saveRecipe} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowRecipeModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Modal */}
            {showOrderModal && (
                <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>➕ أمر تصنيع جديد</h3>
                            <button className="modal-close" onClick={() => setShowOrderModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">الوصفة *</label>
                                <select className="input" value={orderRecipeId} onChange={e => setOrderRecipeId(e.target.value)}>
                                    <option value="">-- اختر الوصفة --</option>
                                    {recipes.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name} ({r.finishedProduct?.name})</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">الكمية المطلوب إنتاجها *</label>
                                <input className="input" type="number" min="1" value={orderQty} onChange={e => setOrderQty(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">ملاحظات</label>
                                <textarea className="input" rows={3} value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
                            </div>
                            {orderRecipeId && (
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', marginTop: '10px' }}>
                                    <strong>التكلفة التقديرية:</strong> {fmt((recipes.find(r => r.id === parseInt(orderRecipeId))?.totalCost || 0) * (parseFloat(orderQty) || 0))} ر.س
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={saveOrder} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 إنشاء الأمر'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowOrderModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
