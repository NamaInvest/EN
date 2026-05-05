'use client';

import React, { useState, useEffect } from 'react';

export default function RoutingOptimizationPage() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [workCenters, setWorkCenters] = useState<any[]>([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedRecipeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = selectedRecipeId ? `/api/manufacturing/routing?recipeId=${selectedRecipeId}` : '/api/manufacturing/routing';
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                if (!selectedRecipeId) {
                    setRecipes(data.data.recipes);
                    setWorkCenters(data.data.workCenters);
                    if (data.data.recipes.length > 0) {
                        setSelectedRecipeId(data.data.recipes[0].id.toString());
                    }
                } else {
                    const recipe = data.data.recipes[0];
                    if (recipe) {
                        setOperations(recipe.operations || []);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/routing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipeId: selectedRecipeId,
                    operations
                })
            });
            if (res.ok) {
                alert('تم حفظ وتحديث مسارات الإنتاج بنجاح.');
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addOperation = () => {
        setOperations([...operations, { 
            operationName: '', 
            workCenterId: workCenters[0]?.id || '', 
            durationMinutes: 0 
        }]);
    };

    const removeOperation = (index: number) => {
        const newOps = [...operations];
        newOps.splice(index, 1);
        setOperations(newOps);
    };

    const moveOperation = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === operations.length - 1) return;

        const newOps = [...operations];
        const temp = newOps[index];
        newOps[index] = newOps[index + (direction === 'up' ? -1 : 1)];
        newOps[index + (direction === 'up' ? -1 : 1)] = temp;
        setOperations(newOps);
    };

    const updateOperation = (index: number, field: string, value: any) => {
        const newOps = [...operations];
        newOps[index] = { ...newOps[index], [field]: value };
        setOperations(newOps);
    };

    // Calculate total duration and estimated cost based on work centers
    let totalDuration = 0;
    let totalCost = 0;
    operations.forEach(op => {
        totalDuration += Number(op.durationMinutes || 0);
        const wc = workCenters.find(w => w.id === Number(op.workCenterId));
        if (wc) {
            totalCost += (Number(op.durationMinutes || 0) / 60) * Number(wc.costPerHour);
        }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تحسين مسارات الإنتاج (Routing Optimization)</h1>
                    <p className="text-gray-500 mt-1">إدارة تسلسل العمليات، ومراكز العمل، وحساب التكاليف المعيارية للإنتاج.</p>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <select 
                        className="border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:text-white font-bold"
                        value={selectedRecipeId}
                        onChange={e => setSelectedRecipeId(e.target.value)}
                    >
                        {recipes.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleSave}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-bold"
                        disabled={loading}
                    >
                        حفظ المسار (Save Routing)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {loading && <div className="text-indigo-600">جاري التحميل...</div>}
                    
                    {!loading && operations.length === 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow text-center border-2 border-dashed border-gray-300">
                            <p className="text-gray-500 mb-4">لا توجد عمليات مضافة لهذا المسار.</p>
                            <button onClick={addOperation} className="bg-white border border-indigo-500 text-indigo-600 px-4 py-2 rounded-md font-bold hover:bg-indigo-50">
                                إضافة العملية الأولى
                            </button>
                        </div>
                    )}

                    {operations.map((op, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-start gap-4 border border-gray-200 dark:border-gray-700 relative">
                            <div className="flex flex-col gap-1 items-center justify-center pt-2">
                                <button onClick={() => moveOperation(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30">▲</button>
                                <span className="bg-indigo-100 text-indigo-800 font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">
                                    {index + 1}
                                </span>
                                <button onClick={() => moveOperation(index, 'down')} disabled={index === operations.length - 1} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30">▼</button>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم العملية (Operation Name)</label>
                                    <input 
                                        type="text" required 
                                        value={op.operationName} onChange={e => updateOperation(index, 'operationName', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-900 dark:text-white"
                                        placeholder="مثال: التقطيع، التجميع، التغليف..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">مركز العمل (Work Center)</label>
                                    <select 
                                        value={op.workCenterId} onChange={e => updateOperation(index, 'workCenterId', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-900 dark:text-white font-bold"
                                    >
                                        {workCenters.map(wc => <option key={wc.id} value={wc.id}>{wc.name} ({wc.costPerHour} SAR/hr)</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">وقت التشغيل (دقائق)</label>
                                    <input 
                                        type="number" required min="0" step="1"
                                        value={op.durationMinutes} onChange={e => updateOperation(index, 'durationMinutes', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={() => removeOperation(index)} className="w-full border border-red-500 text-red-600 p-2 rounded-md hover:bg-red-50 font-bold">
                                        إزالة
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {operations.length > 0 && (
                        <button onClick={addOperation} className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 p-4 rounded-lg hover:bg-indigo-50 font-bold bg-white dark:bg-gray-800 dark:border-indigo-800 dark:hover:bg-gray-700">
                            + إضافة عملية تالية (Add Next Operation)
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-fit border-t-4 border-green-500 sticky top-4">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">ملخص المسار والملاخظات (Routing Summary)</h2>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400 font-bold">إجمالي الوقت (دقائق)</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white">{totalDuration}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400 font-bold">التكلفة المعيارية للتشغيل</span>
                            <span className="text-xl font-black text-green-600">{totalCost.toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400 font-bold">عدد محطات العمل</span>
                            <span className="text-xl font-black text-blue-600">{operations.length}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-2">تسلسل الإنتاج:</h3>
                        <div className="flex flex-wrap gap-2 text-sm">
                            {operations.map((op, i) => (
                                <React.Fragment key={i}>
                                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md font-bold">{op.operationName || 'بدون اسم'}</span>
                                    {i < operations.length - 1 && <span className="text-gray-400 flex items-center">→</span>}
                                </React.Fragment>
                            ))}
                            {operations.length === 0 && <span className="text-gray-500">لا يوجد</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
