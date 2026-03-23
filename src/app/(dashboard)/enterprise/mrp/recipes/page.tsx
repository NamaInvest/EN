'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { 
    ScrollText, Plus, Search, ArrowRight, Save, 
    Trash2, PackageOpen, ListChecks
} from 'lucide-react';

export default function BOMRecipes() {
    const { t } = useTranslation();
    const router = useRouter();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [recipeName, setRecipeName] = useState('');
    const [finishedProductId, setFinishedProductId] = useState('');
    const [ingredients, setIngredients] = useState([{ rawProductId: '', quantity: 1, estimatedCost: 0 }]);

    useEffect(() => {
        fetchData();
        fetchProducts();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/manufacturing/recipes', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setRecipes(await res.json());
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setProducts(await res.json());
        } catch (error) { console.error(error); }
    };

    const addIngredientRow = () => {
        setIngredients([...ingredients, { rawProductId: '', quantity: 1, estimatedCost: 0 }]);
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        const newIng = [...ingredients];
        (newIng[index] as any)[field] = value;
        setIngredients(newIng);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (ingredients.some(i => !i.rawProductId || i.quantity <= 0)) {
            alert('الرجاء التأكد من تعبئة جميع المواد الخام وكمياتها');
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/manufacturing/recipes', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: recipeName,
                    finishedProductId,
                    ingredients
                })
            });

            if (res.ok) {
                setShowModal(false);
                setRecipeName('');
                setFinishedProductId('');
                setIngredients([{ rawProductId: '', quantity: 1, estimatedCost: 0 }]);
                fetchData();
            } else {
                alert('فشل حفظ التركيبة');
            }
        } catch (error) { alert('خطأ في الاتصال'); } 
        finally { setSaving(false); }
    };

    // Filter products: mostly finished goods vs raw
    // Assuming 'raw' items might not have specific flags in basic setup, we just use all products for now.

    const filteredRecipes = recipes.filter(r => r.name?.includes(search) || r.finishedProduct?.name?.includes(search));

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button className="btn btn-ghost" onClick={() => router.push('/enterprise/mrp')} style={{ padding: '8px' }}>
                    <ArrowRight size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ScrollText size={28} color="var(--primary)" />
                        إدارة التركيبات التصنيعية (BOM)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        تعريف المنتجات النهائية والمواد الخام الداخلة في تركيبها ونسب الهدر والتكاليف.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="search-box" style={{ width: '250px' }}>
                        <Search className="search-icon" size={18} />
                        <input 
                            type="text" 
                            className="input" 
                            placeholder="بحث في الوصفات..." 
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> تركيبة تصنيع جديدة
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري تحميل التركيبات...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {filteredRecipes.map((recipe) => (
                        <div key={recipe.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{recipe.name}</h3>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <PackageOpen size={14} /> المنتج المستخرج: {recipe.finishedProduct?.name}
                                        </div>
                                    </div>
                                    <span style={{ background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        أوامر نشطة ({recipe._count?.orders || 0})
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ListChecks size={16} color="var(--text-muted)" /> مكونات وعناصر التركيبة (Ingredients)
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {recipe.ingredients.map((ing: any) => (
                                        <li key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: 'var(--bg-body)', borderRadius: '6px' }}>
                                            <span>• {ing.rawProduct?.name}</span>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <strong style={{ color: 'var(--primary)' }}>{ing.quantity} وحدة</strong>
                                                <span style={{ color: 'var(--text-muted)' }}>{ing.estimatedCost} ريال</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                                    <span>التكلفة القياسية المجمعة:</span>
                                    <span>{recipe.totalCost || 0} SAR</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRecipes.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-body)', borderRadius: '12px' }}>
                            لا توجد تركيبات مسجلة (BOM). اضغط على "تركيبة تصنيع جديدة" للبدء.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>بناء تركيبة تصنيع جديدة (Bill of Materials)</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <form onSubmit={handleSave}>
                                <div className="grid-2" style={{ marginBottom: '24px' }}>
                                    <div className="input-group">
                                        <label className="input-label">اسم التركيبة الرمزي (مثال: وصفة طلاء 1, خلطة إسمنت) *</label>
                                        <input className="input" required placeholder="اسم الوصفة" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">المنتج النهائي المُستخرج (Finished Good) *</label>
                                        <select className="input" required value={finishedProductId} onChange={e => setFinishedProductId(e.target.value)}>
                                            <option value="">-- اختر المنتج النهائي --</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.barcode || 'بدون باركود'}]</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>المواد الخام المكونة (Raw Materials)</h3>
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: '6px', color: 'var(--primary)' }} onClick={addIngredientRow}>
                                        <Plus size={16} /> إضافة مادة خـام
                                    </button>
                                </div>

                                <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {ingredients.map((ing, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '12px', alignItems: 'end' }}>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>المادة / الصنف</label>
                                                <select className="input" required value={ing.rawProductId} onChange={e => updateIngredient(i, 'rawProductId', e.target.value)}>
                                                    <option value="">اختر الصنف...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>الكمية المستهلكة</label>
                                                <input className="input" type="number" dir="ltr" step="0.01" min="0" required value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>التكلفة التقديرية للقطعة (SAR)</label>
                                                <input className="input" type="number" dir="ltr" step="0.01" min="0" value={ing.estimatedCost} onChange={e => updateIngredient(i, 'estimatedCost', e.target.value)} />
                                            </div>
                                            <button 
                                                type="button" 
                                                className="btn btn-ghost" 
                                                style={{ color: 'var(--danger)', height: '42px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                                                onClick={() => removeIngredient(i)}
                                                disabled={ingredients.length === 1}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <Save size={18} style={{ marginLeft: '6px' }} />
                                        {saving ? '⏳ جاري الاعتماد...' : 'حفظ تركيبة التصنيع'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
