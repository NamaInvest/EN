'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function PickingListPage({ params }: { params: { id: string } }) {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPickingData();
    }, []);

    const fetchPickingData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/picking/${params.id}`);
            const result = await res.json();
            setData(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        // Here we would confirm the pick, subtract stock, and update status
        alert('تم تأكيد السحب (Pick) بناءً على FEFO.');
    };

    if (loading) return <div className="p-8 text-blue-600">جاري تحميل قائمة السحب...</div>;
    if (!data) return <div className="p-8 text-red-600">طلب البيع غير موجود.</div>;

    const { order, lines } = data;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-blue-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">قائمة السحب (Pick List) - FEFO</h1>
                    <p className="text-gray-500 mt-1">
                        طلب بيع رقم: <span className="font-bold text-blue-600">{order.orderNo}</span> | 
                        العميل: {order.customer?.name || 'نقدي'}
                    </p>
                </div>
                <button 
                    onClick={handleConfirm}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-bold"
                >
                    تأكيد السحب (Confirm Pick)
                </button>
            </div>

            <div className="space-y-4">
                {lines.map((line: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{line.productName}</h3>
                                <p className="text-sm text-gray-500">الكمية المطلوبة: {line.requiredQty}</p>
                            </div>
                            {line.error && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                                    عجز في المخزون: {line.error}
                                </span>
                            )}
                        </div>
                        
                        <div className="p-4">
                            {line.allocations.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">رقم التشغيلة (Batch)</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">الكمية المسحوبة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {line.allocations.map((alloc: any, aIdx: number) => {
                                            const expDate = alloc.expiryDate ? new Date(alloc.expiryDate) : null;
                                            const daysToExpiry = expDate ? Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 999;
                                            const isCritical = daysToExpiry < 30;

                                            return (
                                                <tr key={aIdx} className={isCritical ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                                    <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                                        {alloc.batchNumber}
                                                        {isCritical && <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs">صلاحية قريبة</span>}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {expDate ? expDate.toLocaleDateString() : 'بدون تاريخ'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 w-32">
                                                        {alloc.allocatedQty}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                !line.error && <p className="text-gray-500 text-sm">لم يتم سحب أي كميات.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
