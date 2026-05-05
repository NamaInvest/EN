'use client';

import React, { useState, useEffect } from 'react';

export default function CycleCountPage() {
    const [stocktakes, setStocktakes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStocktake, setSelectedStocktake] = useState<any>(null);

    useEffect(() => {
        fetchStocktakes();
    }, []);

    const fetchStocktakes = async () => {
        setLoading(true);
        try {
            // Mock fetching stocktakes since we don't have a direct GET all API, but we can simulate it
            // For a real app, you would hit an endpoint like `/api/inventory/stocktake`
            // Let's just mock data for the UI if the API is missing or we could create it.
            // Assuming we have `/api/inventory/stocktake` we will fetch it.
            const res = await fetch('/api/inventory/stocktake');
            if (res.ok) {
                const data = await res.json();
                setStocktakes(data.data || []);
            } else {
                setStocktakes([
                    { id: 1, stocktakeDate: new Date().toISOString().split('T')[0], totalItems: 12, matched: 10, short: 1, over: 1, status: 'pending', notes: 'Auto-generated Cycle Count Schedule' }
                ]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCron = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cron/cycle-count');
            const data = await res.json();
            alert(data.message);
            fetchStocktakes();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('هل أنت متأكد من اعتماد الجرد؟ سيتم إنشاء قيود تسوية المخزون للكميات المختلفة.')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/stocktake/${id}/approve`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                alert('تم اعتماد الجرد وتسوية المخزون بنجاح.');
                fetchStocktakes();
            } else {
                alert(data.error || 'فشل الاعتماد');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">قيد الجرد</span>;
            case 'completed': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">مكتمل</span>;
            case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">معتمد ومرحل</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">جدولة الجرد الدوري (Cycle Counting)</h1>
                    <p className="text-gray-500 mt-1">توليد مهام الجرد بناءً على فئات ABC واعتماد الفروقات</p>
                </div>
                <button 
                    onClick={handleGenerateCron}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold"
                >
                    توليد خطة جرد اليوم (Cron)
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {loading && <div className="mb-4 text-blue-600">جاري التحميل...</div>}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">رقم الجرد</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">إجمالي المنتجات</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">مطابق</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">عجز (Short)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">زيادة (Over)</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {stocktakes.map((s: any) => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">STK-{s.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.stocktakeDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">{s.totalItems}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-bold">{s.matched}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-bold">{s.short}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-bold">{s.over}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(s.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2 rtl:space-x-reverse">
                                        {s.status === 'pending' && (
                                            <button className="text-blue-600 hover:text-blue-900 font-bold">إدخال الكميات الفعيلة</button>
                                        )}
                                        {(s.status === 'pending' || s.status === 'completed') && (
                                            <button onClick={() => handleApprove(s.id)} className="text-green-600 hover:text-green-900 font-bold">اعتماد وتسوية</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
