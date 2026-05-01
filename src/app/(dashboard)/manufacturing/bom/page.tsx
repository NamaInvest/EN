"use client";

import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Save, Trash2, GitMerge, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BOMPage() {
    const [boms, setBoms] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [finishedProductId, setFinishedProductId] = useState('');
    const [recipeName, setRecipeName] = useState('');
    const [scrapPercentage, setScrapPercentage] = useState('0');
    const [ingredients, setIngredients] = useState([{ id: Date.now(), rawProductId: '', quantity: '1', scrapPercentage: '0' }]);
    const [operations, setOperations] = useState([{ id: Date.now(), workCenterId: '', operationName: '', sequenceNumber: '1', durationMinutes: '0' }]);
    const [workCenters, setWorkCenters] = useState<any[]>([]);

    useEffect(() => {
        fetchBOMs();
        fetchProducts();
        fetchWorkCenters();
    }, []);

    const fetchBOMs = async () => {
        try {
            const res = await fetch('/api/manufacturing/bom');
            if (res.ok) {
                setBoms(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchWorkCenters = async () => {
        try {
            const res = await fetch('/api/manufacturing/work-centers');
            if (res.ok) setWorkCenters(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { id: Date.now(), rawProductId: '', quantity: '1', scrapPercentage: '0' }]);
    };

    const handleRemoveIngredient = (id: number) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter(ing => ing.id !== id));
        }
    };

    const handleIngredientChange = (id: number, field: string, value: string) => {
        setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
    };

    const handleAddOperation = () => {
        setOperations([...operations, { id: Date.now(), workCenterId: '', operationName: '', sequenceNumber: (operations.length + 1).toString(), durationMinutes: '0' }]);
    };

    const handleRemoveOperation = (id: number) => {
        if (operations.length > 1) {
            setOperations(operations.filter(op => op.id !== id));
        }
    };

    const handleOperationChange = (id: number, field: string, value: string) => {
        setOperations(operations.map(op => op.id === id ? { ...op, [field]: value } : op));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    finishedProductId,
                    name: recipeName,
                    scrapPercentage,
                    ingredients: ingredients.filter(i => i.rawProductId), // skip empty
                    operations: operations.filter(o => o.workCenterId) // skip empty
                })
            });
            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: data.message });
                setIsFormOpen(false);
                fetchBOMs();
                // Reset form
                setFinishedProductId('');
                setRecipeName('');
                setIngredients([{ id: Date.now(), rawProductId: '', quantity: '1', scrapPercentage: '0' }]);
                setOperations([{ id: Date.now(), workCenterId: '', operationName: '', sequenceNumber: '1', durationMinutes: '0' }]);
            } else {
                setNotification({ type: 'error', message: data.error });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'فشل الاتصال بالخادم' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-indigo-500/20 rounded-2xl">
                            <GitMerge className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">وصفات التصنيع (BOM)</h1>
                            <p className="text-slate-400 mt-1">إدارة هيكل المنتجات المتعدد المستويات ونسب الهالك</p>
                        </div>
                    </div>
                    <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20">
                        {isFormOpen ? 'إلغاء' : <><Plus className="w-5 h-5 ml-2" /> وصفة جديدة</>}
                    </button>
                </div>

                {notification && (
                    <div className={`p-4 rounded-xl flex items-center space-x-3 space-x-reverse ${notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                )}

                {/* Create Form */}
                {isFormOpen && (
                    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">تفاصيل الوصفة الجديدة</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">اسم الوصفة (Recipe Name)</label>
                                <input required type="text" value={recipeName} onChange={e => setRecipeName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثال: وصفة قهوة تركية 250جم" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">المنتج النهائي (Finished Product)</label>
                                <select required value={finishedProductId} onChange={e => setFinishedProductId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">اختر المنتج...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">نسبة الهالك الإجمالية للوصفة %</label>
                                <input type="number" min="0" step="0.1" value={scrapPercentage} onChange={e => setScrapPercentage(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">المواد الخام (Raw Materials)</h3>
                                <button type="button" onClick={handleAddIngredient} className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors flex items-center">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة مادة
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {ingredients.map((ing, index) => (
                                    <div key={ing.id} className="flex items-center space-x-3 space-x-reverse bg-slate-950 p-3 rounded-xl border border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-sm">{index + 1}</div>
                                        <select required value={ing.rawProductId} onChange={e => handleIngredientChange(ing.id, 'rawProductId', e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none">
                                            <option value="">اختر المادة الخام...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="w-32">
                                            <input required type="number" min="0.001" step="0.001" placeholder="الكمية" value={ing.quantity} onChange={e => handleIngredientChange(ing.id, 'quantity', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <div className="w-32 relative">
                                            <input type="number" min="0" step="0.1" placeholder="هالك %" value={ing.scrapPercentage} onChange={e => handleIngredientChange(ing.id, 'scrapPercentage', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pl-8 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">%</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveIngredient(ing.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 mt-8 border-t border-slate-800 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">مسارات التوجيه ومراكز العمل (Routing & Operations)</h3>
                                <button type="button" onClick={handleAddOperation} className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors flex items-center">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة عملية
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {operations.map((op, index) => (
                                    <div key={op.id} className="flex items-center space-x-3 space-x-reverse bg-slate-950 p-3 rounded-xl border border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-sm">{index + 1}</div>
                                        <select required value={op.workCenterId} onChange={e => handleOperationChange(op.id, 'workCenterId', e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none">
                                            <option value="">اختر مركز العمل...</option>
                                            {workCenters.map(w => <option key={w.id} value={w.id}>{w.name} ({w.costPerHour} SAR/hr)</option>)}
                                        </select>
                                        <div className="flex-1">
                                            <input required type="text" placeholder="اسم العملية (مثال: لحام)" value={op.operationName} onChange={e => handleOperationChange(op.id, 'operationName', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <div className="w-32 relative">
                                            <input required type="number" min="1" placeholder="المدة (د)" value={op.durationMinutes} onChange={e => handleOperationChange(op.id, 'durationMinutes', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">دقيقة</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveOperation(op.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button disabled={loading} type="submit" className="flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                                {loading ? 'جاري الحفظ...' : <><Save className="w-5 h-5 ml-2" /> حفظ الوصفة (BOM)</>}
                            </button>
                        </div>
                    </form>
                )}

                {/* BOM List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading && !isFormOpen ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">جاري تحميل البيانات...</div>
                    ) : (
                        boms.map(bom => (
                            <div key={bom.id} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl hover:border-indigo-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{bom.name}</h3>
                                        <p className="text-slate-400 text-sm mt-1">المنتج: <span className="text-indigo-400 font-semibold">{bom.finishedProduct?.name}</span></p>
                                    </div>
                                    <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
                                        نشط
                                    </div>
                                </div>
                                
                                <div className="flex space-x-4 space-x-reverse mb-6">
                                    <div className="bg-slate-950 rounded-xl p-3 flex-1 border border-slate-800 text-center">
                                        <p className="text-xs text-slate-500 mb-1">التكلفة التقديرية</p>
                                        <p className="font-mono text-emerald-400 font-bold">{bom.totalCost.toFixed(2)} SAR</p>
                                    </div>
                                    <div className="bg-slate-950 rounded-xl p-3 flex-1 border border-slate-800 text-center">
                                        <p className="text-xs text-slate-500 mb-1">هالك الوصفة</p>
                                        <p className="font-mono text-rose-400 font-bold">{bom.scrapPercentage}%</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-300 mb-3 flex items-center"><PackageOpen className="w-4 h-4 ml-1 text-slate-500"/> المواد الخام ({bom.ingredients?.length}):</p>
                                    <div className="space-y-2">
                                        {bom.ingredients?.map((ing: any) => (
                                            <div key={ing.id} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
                                                <span className="text-slate-400">{ing.rawProduct?.name}</span>
                                                <div className="flex items-center space-x-3 space-x-reverse">
                                                    <span className="text-rose-400 text-xs bg-rose-400/10 px-2 py-0.5 rounded">هالك: {ing.scrapPercentage}%</span>
                                                    <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{ing.quantity} وحدة</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {bom.operations && bom.operations.length > 0 && (
                                    <div className="mt-4 border-t border-slate-800/50 pt-3">
                                        <p className="text-sm font-bold text-slate-300 mb-2 flex items-center"><GitMerge className="w-4 h-4 ml-1 text-slate-500"/> مسارات التوجيه ({bom.operations.length}):</p>
                                        <div className="space-y-2">
                                            {bom.operations.map((op: any) => (
                                                <div key={op.id} className="flex justify-between items-center text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                                                    <span className="text-slate-400">{op.sequenceNumber}- {op.operationName} <span className="text-slate-500">({op.workCenter?.name})</span></span>
                                                    <span className="font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">{op.durationMinutes} دقيقة</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    
                    {!loading && boms.length === 0 && (
                        <div className="col-span-2 text-center py-20">
                            <GitMerge className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">لا توجد وصفات تصنيع</h3>
                            <p className="text-slate-500 mt-2">انقر على "وصفة جديدة" للبدء في بناء هيكل المنتجات</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
