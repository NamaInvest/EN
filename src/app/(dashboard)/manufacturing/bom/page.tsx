'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ChevronRight, ChevronDown, Wrench, Package, Search, Plus, Trash2, X, FileText, CheckCircle, ArrowLeft, Beaker } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BOMPage() {
    const { lang } = useTranslation();
    const { success, error: toastError, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [view, setView] = useState<'list' | 'explode'>('list');
    const [recipes, setRecipes] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [targetQty, setTargetQty] = useState(1);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState({
        name: '',
        finishedProductId: '',
        scrapPercentage: 0,
        expectedYieldQty: 1,
        expectedYieldWeight: 0,
        ingredients: [{ rawProductId: '', quantity: 1, scrapPercentage: 0, weightBefore: 0, weightAfter: 0, qtyBefore: 1, qtyAfter: 1 }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bomRes, prodRes] = await Promise.all([
                fetch('/api/manufacturing/bom'),
                fetch('/api/products')
            ]);
            if (!bomRes.ok || !prodRes.ok) throw new Error('API Error');
            const bomData = await bomRes.json();
            const prodData = await prodRes.json();
            setRecipes(bomData || []);
            setProducts(prodData || []);
        } catch (e) {
            console.error(e);
            toastError(_t('فشل جلب البيانات', 'Failed to fetch data'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { rawProductId: '', quantity: 1, scrapPercentage: 0, weightBefore: 0, weightAfter: 0, qtyBefore: 1, qtyAfter: 1 }]
        }));
    };

    const handleRemoveIngredient = (index: number) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.finishedProductId) {
            toastError(_t('يرجى تعبئة الحقول المطلوبة', 'Please fill required fields'));
            return;
        }
        if (formData.ingredients.length === 0 || !formData.ingredients[0].rawProductId) {
            toastError(_t('يرجى إضافة مكون واحد على الأقل', 'Please add at least one ingredient'));
            return;
        }

        try {
            const res = await fetch('/api/manufacturing/bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || 'Failed to save');
            }

            success(_t('تم إنشاء معادلة التصنيع بنجاح', 'BOM created successfully'));
            setShowModal(false);
            setFormData({
                name: '', finishedProductId: '', scrapPercentage: 0, expectedYieldQty: 1, expectedYieldWeight: 0,
                ingredients: [{ rawProductId: '', quantity: 1, scrapPercentage: 0, weightBefore: 0, weightAfter: 0, qtyBefore: 1, qtyAfter: 1 }]
            });
            fetchData();
        } catch (e: any) {
            toastError(e.message || _t('فشل حفظ المعادلة', 'Failed to save BOM'));
        }
    };

    const openExplodeView = (recipe: any) => {
        setSelectedRecipe(recipe);
        setTargetQty(1);
        setExpanded({});
        setView('explode');
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            {_t('جاري تحميل معادلات التصنيع...', 'Loading BOMs...')}
        </div>;
    }

    return (
        <div className={`p-6 space-y-6 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {_t('معادلات التصنيع (BOM)', 'Bill of Materials (BOM)')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {_t('إدارة وهيكلة مكونات المنتجات لعمليات التصنيع', 'Manage and structure product components for manufacturing')}
                    </p>
                </div>
                {view === 'list' ? (
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                            <Wrench className="w-4 h-4 mr-2" />
                            {_t('موافقات التغيير (ECO)', 'ECO Approvals')}
                        </button>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {_t('إنشاء معادلة جديدة', 'New BOM Formula')}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setView('list')}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                    >
                        <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {_t('العودة للقائمة', 'Back to List')}
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.length === 0 ? (
                        <div className="col-span-full text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {_t('لا توجد معادلات تصنيع', 'No BOM formulas found')}
                            </h3>
                            <p className="text-gray-500 mt-1">
                                {_t('ابدأ بإنشاء أول معادلة تصنيع للمنتجات', 'Start by creating your first product formula')}
                            </p>
                        </div>
                    ) : (
                        recipes.map((recipe) => (
                            <div key={recipe.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{recipe.name}</h3>
                                                <p className="text-sm text-gray-500">{recipe.finishedProduct?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                            <p className="text-gray-500 text-xs">{_t('التكلفة المعيارية', 'Standard Cost')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{(recipe.totalCost || 0).toFixed(2)} SAR</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                            <p className="text-gray-500 text-xs">{_t('المكونات الأساسية', 'Raw Materials')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{recipe.ingredients?.length || 0} {_t('عنصر', 'Items')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-b-lg flex justify-between items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {recipe.isActive ? _t('نشط', 'Active') : _t('غير نشط', 'Inactive')}
                                    </span>
                                    <button 
                                        onClick={() => openExplodeView(recipe)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium flex items-center"
                                    >
                                        <Layers className={`w-4 h-4 ${lang === 'ar' ? 'ml-1' : 'mr-1'}`} />
                                        {_t('تحليل المعادلة', 'Explode BOM')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === 'explode' && selectedRecipe && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center rounded-t-lg">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <span className="text-sm text-gray-500">{_t('الكمية المستهدفة:', 'Target Qty:')}</span>
                                <input 
                                    type="number" 
                                    value={targetQty}
                                    onChange={(e) => setTargetQty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-24 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-3 text-sm dark:bg-gray-700 dark:text-white" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 flex justify-between items-end border-b border-gray-100 dark:border-gray-700 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <Package className={`w-5 h-5 text-blue-600 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                    {selectedRecipe.finishedProduct?.name} ({selectedRecipe.name})
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {_t('الكمية المستهدفة:', 'Target Production:')} {targetQty} {_t('وحدة', 'Units')}
                                </p>
                            </div>
                            <div className="text-right rtl:text-left">
                                <p className="text-sm text-gray-500">{_t('إجمالي التكلفة المتوقعة', 'Total Standard Cost')}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {((selectedRecipe.totalCost || 0) * targetQty).toFixed(2)} SAR
                                </p>
                            </div>
                        </div>

                        {/* BOM Tree */}
                        <div className="space-y-1 font-mono text-sm">
                            <div className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group">
                                <div className="w-8 flex justify-center cursor-pointer" onClick={() => toggleExpand('root')}>
                                    {expanded['root'] ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                                <div className="flex-1 flex items-center font-bold text-gray-900 dark:text-white">
                                    <Layers className={`w-4 h-4 text-blue-600 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} /> 
                                    {selectedRecipe.finishedProduct?.name} ({_t('منتج نهائي', 'Finished Good')})
                                </div>
                                <div className="w-24 text-right rtl:text-left">{targetQty} {_t('قطعة', 'pcs')}</div>
                                <div className="w-32 text-right rtl:text-left">{((selectedRecipe.totalCost || 0) * targetQty).toFixed(2)} SAR</div>
                            </div>

                            {!expanded['root'] && selectedRecipe.ingredients?.map((ing: any, idx: number) => (
                                <div key={idx} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="w-8"></div>
                                    <div className="w-8 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div></div>
                                    <div className="flex-1 flex items-center text-gray-600 dark:text-gray-300">
                                        {ing.rawProduct?.name}
                                    </div>
                                    <div className="w-24 text-right rtl:text-left text-gray-500 dark:text-gray-400">{(ing.quantity * targetQty).toFixed(2)}</div>
                                    <div className="w-32 text-right rtl:text-left text-gray-500 dark:text-gray-400">{((ing.estimatedCost || 0) * targetQty).toFixed(2)} SAR</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Beaker className={`w-5 h-5 text-blue-600 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                {_t('إنشاء معادلة تصنيع جديدة', 'Create New BOM Formula')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {_t('اسم المعادلة (النسخة)', 'Formula Name (Version)')} <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder={_t('مثال: الاصدار الاساسي V1', 'e.g. Base Version V1')}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {_t('المنتج النهائي المخرجات', 'Finished Product')} <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        value={formData.finishedProductId}
                                        onChange={e => setFormData({...formData, finishedProductId: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">{_t('اختر المنتج النهائي...', 'Select Finished Product...')}</option>
                                        {products.filter(p => !p.isRawMaterial).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {_t('الكمية المتوقعة للمخرجات', 'Expected Yield Qty')}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={formData.expectedYieldQty}
                                        onChange={e => setFormData({...formData, expectedYieldQty: parseFloat(e.target.value) || 0})}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {_t('الوزن المتوقع للمخرجات', 'Expected Yield Weight')}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={formData.expectedYieldWeight}
                                        onChange={e => setFormData({...formData, expectedYieldWeight: parseFloat(e.target.value) || 0})}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {_t('المواد الخام (المكونات)', 'Raw Materials (Ingredients)')}
                                    </h3>
                                    <button 
                                        onClick={handleAddIngredient}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1 ml-1" />
                                        {_t('إضافة مكون', 'Add Ingredient')}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-right rtl:text-right border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
                                                <th className="px-3 py-2">{_t('المادة الخام', 'Raw Material')}</th>
                                                <th className="px-3 py-2 w-28">{_t('كمية قبل', 'Qty Before')}</th>
                                                <th className="px-3 py-2 w-28">{_t('كمية بعد', 'Qty After')}</th>
                                                <th className="px-3 py-2 w-28">{_t('الوزن قبل', 'Wt Before')}</th>
                                                <th className="px-3 py-2 w-28">{_t('الوزن بعد', 'Wt After')}</th>
                                                <th className="px-3 py-2 w-16 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {formData.ingredients.map((ing, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-2 py-2">
                                                        <select 
                                                            value={ing.rawProductId}
                                                            onChange={e => {
                                                                const newIngs = [...formData.ingredients];
                                                                newIngs[idx].rawProductId = e.target.value;
                                                                setFormData({...formData, ingredients: newIngs});
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                        >
                                                            <option value="">{_t('اختر...', 'Select...')}</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={ing.qtyBefore}
                                                            onChange={e => {
                                                                const newIngs = [...formData.ingredients];
                                                                newIngs[idx].qtyBefore = parseFloat(e.target.value) || 0;
                                                                newIngs[idx].quantity = newIngs[idx].qtyBefore;
                                                                setFormData({...formData, ingredients: newIngs});
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={ing.qtyAfter}
                                                            onChange={e => {
                                                                const newIngs = [...formData.ingredients];
                                                                newIngs[idx].qtyAfter = parseFloat(e.target.value) || 0;
                                                                setFormData({...formData, ingredients: newIngs});
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={ing.weightBefore}
                                                            onChange={e => {
                                                                const newIngs = [...formData.ingredients];
                                                                newIngs[idx].weightBefore = parseFloat(e.target.value) || 0;
                                                                setFormData({...formData, ingredients: newIngs});
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={ing.weightAfter}
                                                            onChange={e => {
                                                                const newIngs = [...formData.ingredients];
                                                                newIngs[idx].weightAfter = parseFloat(e.target.value) || 0;
                                                                setFormData({...formData, ingredients: newIngs});
                                                            }}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button 
                                                            onClick={() => handleRemoveIngredient(idx)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded inline-flex items-center justify-center"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {formData.ingredients.length === 0 && (
                                        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg mt-2">
                                            {_t('لم يتم إضافة أي مكونات. المعادلة يجب أن تحتوي على الأقل مكون واحد.', 'No ingredients added. A BOM must have at least one ingredient.')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
                            >
                                {_t('إلغاء', 'Cancel')}
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm flex items-center"
                            >
                                <CheckCircle className={`w-4 h-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                {_t('حفظ واعتماد المعادلة', 'Save & Approve BOM')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
