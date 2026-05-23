'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang } = useTranslation();
  const { warning: toastWarning } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [customer, setCustomer] = useState<any>(null);
    const [creditInfo, setCreditInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [holding, setHolding] = useState(false);

    useEffect(() => {
        fetchCustomerData();
    }, [(await params).id]);

    const fetchCustomerData = async () => {
        setLoading(true);
        try {
            // Fetch basic info
            const resCust = await fetch(`/api/customers/${(await params).id}`);
            if (resCust.ok) setCustomer(await resCust.json());

            // Fetch credit engine data
            const resCredit = await fetch(`/api/customers/${(await params).id}/credit`);
            if (resCredit.ok) setCreditInfo(await resCredit.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleHold = async () => {
        if (!creditInfo) return;
        setHolding(true);
        const action = creditInfo.customerStatus === 'ON_HOLD' ? 'RELEASE' : 'HOLD';
        try {
            const res = await fetch(`/api/customers/${(await params).id}/hold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                const data = await res.json();
                setCreditInfo((prev: any) => ({ ...prev, customerStatus: data.status }));
            }
        } catch (e) {
            console.error(e);
            toastWarning('Failed to update hold status');
        } finally {
            setHolding(false);
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;
    if (!customer) return <div className="p-8">العميل غير موجود</div>;

    const isHold = creditInfo?.customerStatus === 'ON_HOLD';
    const limitExceeded = creditInfo?.totalExposure > creditInfo?.creditLimit;
    const score = creditInfo ? Math.max(0, 100 - (creditInfo.totalExposure / (creditInfo.creditLimit || 1)) * 100) : 100;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                    <p className="text-gray-500 mt-1">رقم العميل: {customer.customerNo || customer.id}</p>
                    {isHold && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {_t('موقوف عن التعامل (معلق)', 'موقوف عن التعامل (ON HOLD)')}</span>
                    )}
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button 
                        onClick={toggleHold}
                        disabled={holding}
                        className={`px-4 py-2 rounded-md font-medium text-white ${isHold ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {isHold ? 'فك الإيقاف' : 'إيقاف مؤقت'}
                    </button>
                    <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                        طلب زيادة الحد
                    </button>
                </div>
            </div>

            {/* Credit Dashboard */}
            {creditInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-blue-500">
                        <p className="text-sm text-gray-500 dark:text-gray-400">الحد الائتماني (Credit Limit)</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {creditInfo.creditLimit.toLocaleString()} SAR
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-yellow-500">
                        <p className="text-sm text-gray-500 dark:text-gray-400">المستخدم (Used Credit)</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {creditInfo.usedCredit.toLocaleString()} SAR
                        </p>
                        <p className="text-xs text-gray-400 mt-1">+ {creditInfo.pendingOrders} طلبات معلقة</p>
                    </div>

                    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 ${limitExceeded ? 'border-red-500' : 'border-green-500'}`}>
                        <p className="text-sm text-gray-500 dark:text-gray-400">المتاح (Available)</p>
                        <p className={`text-2xl font-bold mt-2 ${limitExceeded ? 'text-red-600' : 'text-green-600'}`}>
                            {creditInfo.availableCredit.toLocaleString()} SAR
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-t-4 border-purple-500">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{_t('تقييم الائتمان (درجة)', 'تقييم الائتمان (Score)')}</p>
                        <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                                <div className="h-4 rounded-full" style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: score > 50 ? '#10B981' : score > 20 ? '#F59E0B' : '#EF4444' }}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium">{score.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Aging Buckets (Mocked view) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">أعمار الديون (Aging Buckets)</h2>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="text-sm text-green-800 dark:text-green-400">غير مستحق / 0-30</p>
                        <p className="text-xl font-bold mt-1 text-green-600">{(creditInfo?.usedCredit * 0.7 || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">31-60 يوم</p>
                        <p className="text-xl font-bold mt-1 text-yellow-600">{(creditInfo?.usedCredit * 0.2 || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <p className="text-sm text-orange-800 dark:text-orange-400">61-90 يوم</p>
                        <p className="text-xl font-bold mt-1 text-orange-600">{(creditInfo?.usedCredit * 0.05 || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-sm text-red-800 dark:text-red-400">91+ يوم (متأخر جداً)</p>
                        <p className="text-xl font-bold mt-1 text-red-600">{(creditInfo?.usedCredit * 0.05 || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
