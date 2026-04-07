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
            alert(t('sys.str_2835'));
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
                alert(t('sys.str_2836'));
            }
        } catch (error) { alert(t('sys.str_446')); } 
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
                        {t('sys.str_2816')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        {t('sys.str_2817')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="search-box" style={{ width: '250px' }}>
                        <Search className="search-icon" size={18} />
                        <input 
                            type="text" 
                            className="input" 
                            placeholder={t('sys.str_2837')} 
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> {t('sys.str_2818')}</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_2819')}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {filteredRecipes.map((recipe) => (
                        <div key={recipe.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: 'var(--bg-body)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{recipe.name}</h3>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <PackageOpen size={14} /> {t('sys.str_2820')}{recipe.finishedProduct?.name}
                                        </div>
                                    </div>
                                    <span style={{ background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {t('sys.str_2821')}{recipe._count?.orders || 0})
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ListChecks size={16} color="var(--text-muted)" /> {t('sys.str_2822')}</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {recipe.ingredients.map((ing: any) => (
                                        <li key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: 'var(--bg-body)', borderRadius: '6px' }}>
                                            <span>• {ing.rawProduct?.name}</span>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <strong style={{ color: 'var(--primary)' }}>{ing.quantity} {t('sys.str_1910')}</strong>
                                                <span style={{ color: 'var(--text-muted)' }}>{ing.estimatedCost} {t('sys.str_2823')}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                                    <span>{t('sys.str_2824')}</span>
                                    <span>{recipe.totalCost || 0} SAR</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRecipes.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-body)', borderRadius: '12px' }}>
                            {t('sys.str_2825')}</div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('sys.str_2826')}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <form onSubmit={handleSave}>
                                <div className="grid-2" style={{ marginBottom: '24px' }}>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2827')}</label>
                                        <input className="input" required placeholder={t('sys.str_2838')} value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2828')}</label>
                                        <select className="input" required value={finishedProductId} onChange={e => setFinishedProductId(e.target.value)}>
                                            <option value="">{t('sys.str_2829')}</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.barcode || t('sys.str_421')}]</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{t('sys.str_2830')}</h3>
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: '6px', color: 'var(--primary)' }} onClick={addIngredientRow}>
                                        <Plus size={16} /> {t('sys.str_2831')}</button>
                                </div>

                                <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {ingredients.map((ing, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '12px', alignItems: 'end' }}>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>{t('sys.str_2832')}</label>
                                                <select className="input" required value={ing.rawProductId} onChange={e => updateIngredient(i, 'rawProductId', e.target.value)}>
                                                    <option value="">{t('stock.str_2628')}</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>{t('sys.str_2833')}</label>
                                                <input className="input" type="number" dir="ltr" step="0.01" min="0" required value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '11px' }}>{t('sys.str_2834')}</label>
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
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <Save size={18} style={{ marginLeft: '6px' }} />
                                        {saving ? t('sys.str_2839') : t('sys.str_2840')}
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
