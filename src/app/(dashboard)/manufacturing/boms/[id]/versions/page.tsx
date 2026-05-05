'use client';

import React, { useState, useEffect } from 'react';

export default function BOMVersionsPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [sourceVersion, setSourceVersion] = useState<any>(null);
    const [newVersionNumber, setNewVersionNumber] = useState('');
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [compareVersions, setCompareVersions] = useState<any[]>([]); // [v1, v2]

    useEffect(() => {
        fetchVersions();
    }, []);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/boms/${params.id}/versions`);
            const result = await res.json();
            if (result.success) {
                setProduct(result.data.product);
                setVersions(result.data.versions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (versionId: number) => {
        if (!confirm('هل أنت متأكد من تفعيل هذا الإصدار؟ سيتم إيقاف الإصدارات الفعالة الحالية.')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/boms/versions/${versionId}/activate`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                alert('تم تفعيل الإصدار بنجاح.');
                fetchVersions();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/boms/${params.id}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceVersionId: sourceVersion.id,
                    newVersionNumber,
                    ingredients: sourceVersion.ingredients, // clone as is, edit later
                    ecrReference: 'User Clone Action'
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('تم إنشاء نسخة جديدة بنجاح.');
                setIsCloneModalOpen(false);
                fetchVersions();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openCompare = () => {
        const activeV = versions.find(v => v.status === 'ACTIVE');
        const draftV = versions.find(v => v.status === 'DRAFT');
        if (activeV && draftV) {
            setCompareVersions([activeV, draftV]);
            setIsCompareModalOpen(true);
        } else if (versions.length >= 2) {
            setCompareVersions([versions[0], versions[1]]);
            setIsCompareModalOpen(true);
        } else {
            alert('يجب أن يكون هناك إصدارين على الأقل للمقارنة.');
        }
    };

    if (loading && !product) return <div className="p-8 text-blue-600">جاري تحميل الإصدارات...</div>;
    if (!product) return <div className="p-8 text-red-600">المنتج غير موجود.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تاريخ إصدارات BOM</h1>
                    <p className="text-gray-500 mt-1">
                        المنتج: <span className="font-bold text-indigo-600">{product.name}</span>
                    </p>
                </div>
                <div className="space-x-2 rtl:space-x-reverse">
                    <button 
                        onClick={openCompare}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-bold"
                    >
                        مقارنة الإصدارات (Compare)
                    </button>
                    <button 
                        onClick={() => {
                            const active = versions.find(v => v.status === 'ACTIVE') || versions[0];
                            if (active) {
                                setSourceVersion(active);
                                setNewVersionNumber(`V${versions.length + 1}.0`);
                                setIsCloneModalOpen(true);
                            }
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-bold"
                        disabled={versions.length === 0}
                    >
                        إصدار جديد (Clone & New)
                    </button>
                </div>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {versions.map((version, index) => (
                    <div key={version.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <span className="font-bold text-sm">v{version.versionNumber}</span>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">BOM: {version.versionNumber}</h3>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                    version.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    version.status === 'OBSOLETE' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {version.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                ساري من: {new Date(version.effectiveFrom).toLocaleDateString()}
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mb-4 text-sm">
                                <ul className="space-y-1">
                                    {version.ingredients.slice(0, 3).map((ing: any) => (
                                        <li key={ing.id} className="text-gray-600 dark:text-gray-400">
                                            • {ing.rawProduct?.name} (الكمية: {ing.quantity})
                                        </li>
                                    ))}
                                    {version.ingredients.length > 3 && (
                                        <li className="text-indigo-600">+ {version.ingredients.length - 3} مكونات أخرى</li>
                                    )}
                                </ul>
                            </div>
                            <div className="flex justify-end">
                                {version.status === 'DRAFT' && (
                                    <button 
                                        onClick={() => handleActivate(version.id)}
                                        className="text-sm font-bold text-green-600 hover:text-green-800"
                                    >
                                        تفعيل كإصدار حالي (Activate)
                                    </button>
                                )}
                                {version.status === 'ACTIVE' && (
                                    <span className="text-sm font-bold text-gray-400">الإصدار المعتمد حالياً</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Clone Modal */}
            {isCloneModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">إنشاء إصدار BOM جديد</h2>
                        <form onSubmit={handleCloneSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسخ من (Source Version)</label>
                                <input 
                                    type="text" 
                                    disabled 
                                    value={sourceVersion.versionNumber} 
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الإصدار الجديد</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newVersionNumber}
                                    onChange={e => setNewVersionNumber(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
                                <button type="button" onClick={() => setIsCloneModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold" disabled={loading}>حفظ وإنشاء DRAFT</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Compare Modal */}
            {isCompareModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">مقارنة الإصدارات (BOM Diff)</h2>
                            <button onClick={() => setIsCompareModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {compareVersions.map((v, i) => (
                                <div key={v.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h3 className="font-bold text-lg mb-2 dark:text-white">الإصدار {v.versionNumber} ({v.status})</h3>
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mt-4">
                                        <thead>
                                            <tr>
                                                <th className="text-right text-xs font-medium text-gray-500 uppercase">المكون</th>
                                                <th className="text-center text-xs font-medium text-gray-500 uppercase">الكمية</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {v.ingredients.map((ing: any) => {
                                                // Find if it exists in other version and compare qty
                                                const otherV = i === 0 ? compareVersions[1] : compareVersions[0];
                                                const otherIng = otherV.ingredients.find((o: any) => o.rawProductId === ing.rawProductId);
                                                
                                                let bgColor = '';
                                                if (!otherIng) bgColor = 'bg-green-50 dark:bg-green-900/20'; // Added
                                                else if (otherIng.quantity !== ing.quantity) bgColor = 'bg-yellow-50 dark:bg-yellow-900/20'; // Changed

                                                return (
                                                    <tr key={ing.id} className={bgColor}>
                                                        <td className="py-2 text-sm text-gray-900 dark:text-white font-medium">{ing.rawProduct?.name}</td>
                                                        <td className={`py-2 text-center text-sm font-bold ${bgColor === 'bg-yellow-50 dark:bg-yellow-900/20' ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {ing.quantity}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
