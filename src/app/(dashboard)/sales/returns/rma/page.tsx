'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function RMAPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rmas, setRmas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Tab state
    const [activeTab, setActiveTab] = useState('NEW');

    useEffect(() => {
        fetchRmas();
    }, []);

    const fetchRmas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales/returns');
            if (res.ok) setRmas(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: string) => {
        try {
            const res = await fetch(`/api/sales/returns/${id}/${action}`, {
                method: 'POST'
            });
            if (res.ok) {
                alert(`تم تحديث حالة الطلب إلى: ${action}`);
                fetchRmas();
            } else {
                const data = await res.json();
                alert(`خطأ: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredRmas = rmas.filter(r => {
        if (activeTab === 'NEW') return r.status === 'REQUESTED';
        if (activeTab === 'IN_PROCESS') return ['APPROVED', 'RECEIVED', 'INSPECTED'].includes(r.status);
        if (activeTab === 'CLOSED') return ['REFUNDED', 'RESTOCKED', 'SCRAPPED', 'REJECTED'].includes(r.status);
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">طلبات إرجاع البضائع (RMA)</h1>
                    <p className="text-gray-500 mt-1">إدارة الموافقة واستلام المرتجعات</p>
                </div>
                <div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        طلب جديد
                    </button>
                </div>
            </div>

            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button 
                    onClick={() => setActiveTab('NEW')}
                    className={`pb-2 px-4 font-medium text-sm ${activeTab === 'NEW' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    طلبات جديدة
                </button>
                <button 
                    onClick={() => setActiveTab('IN_PROCESS')}
                    className={`pb-2 px-4 font-medium text-sm ${activeTab === 'IN_PROCESS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    قيد المعالجة
                </button>
                <button 
                    onClick={() => setActiveTab('CLOSED')}
                    className={`pb-2 px-4 font-medium text-sm ${activeTab === 'CLOSED' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    مغلقة
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الـ RMA</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفاتورة الأصلية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رسوم الإعادة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading && <tr><td colSpan={6} className="px-6 py-4 text-center">جاري التحميل...</td></tr>}
                        {!loading && filteredRmas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">لا يوجد طلبات.</td>
                            </tr>
                        )}
                        {filteredRmas.map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {r.returnNo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {r.originalInvoiceId || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {r.total.toLocaleString()} SAR
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {r.restockingFee}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                                    {r.status === 'REQUESTED' && (
                                        <>
                                            <button onClick={() => handleAction(r.id, 'APPROVED')} className="text-green-600 hover:text-green-900">موافقة</button>
                                            <button onClick={() => handleAction(r.id, 'REJECTED')} className="text-red-600 hover:text-red-900">رفض</button>
                                        </>
                                    )}
                                    {r.status === 'APPROVED' && (
                                        <button onClick={() => handleAction(r.id, 'RECEIVED')} className="text-blue-600 hover:text-blue-900">تأكيد الاستلام</button>
                                    )}
                                    {r.status === 'RECEIVED' && (
                                        <button onClick={() => handleAction(r.id, 'INSPECTED')} className="text-purple-600 hover:text-purple-900">إنهاء الفحص</button>
                                    )}
                                    {r.status === 'INSPECTED' && (
                                        <>
                                            <button onClick={() => handleAction(r.id, 'RESTOCKED')} className="text-green-600 hover:text-green-900">إعادة للمخزون</button>
                                            <button onClick={() => handleAction(r.id, 'SCRAPPED')} className="text-red-600 hover:text-red-900">إتلاف</button>
                                            <button onClick={() => handleAction(r.id, 'REFUNDED')} className="text-blue-600 hover:text-blue-900">إصدار إشعار دائن (Refund)</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
