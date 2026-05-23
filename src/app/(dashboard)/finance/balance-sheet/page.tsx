'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function BalanceSheetPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [asOfDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/balance-sheet?asOfDate=${asOfDate}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-indigo-600 font-bold">جاري إعداد الميزانية العمومية...</div>;

    const { assets, liabilities, equity } = data;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الميزانية العمومية (Balance Sheet)</h1>
                    <p className="text-gray-500 mt-1">المركز المالي للمنشأة كما هو في تاريخ محدد.</p>
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-2">كما في تاريخ:</label>
                    <input 
                        type="date" 
                        value={asOfDate} 
                        onChange={(e) => setAsOfDate(e.target.value)} 
                        className="border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets (Right Side) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2">{_t('الأصول (أصول)', 'الأصول (Assets)')}</h2>
                    
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">الأصول المتداولة</h3>
                        <div className="space-y-1">
                            {assets.current.map((a: any) => (
                                <div key={a.id} className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                    <span>{a.code} - {a.name}</span>
                                    <span className="font-semibold">{a.balance.toLocaleString()} SAR</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">الأصول الثابتة</h3>
                        <div className="space-y-1">
                            {assets.fixed.map((a: any) => (
                                <div key={a.id} className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                    <span>{a.code} - {a.name}</span>
                                    <span className="font-semibold">{a.balance.toLocaleString()} SAR</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">إجمالي الأصول</span>
                        <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{assets.total.toLocaleString()} SAR</span>
                    </div>
                </div>

                {/* Liabilities & Equity (Left Side) */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2">{_t('الخصوم (التزامات)', 'الخصوم (Liabilities)')}</h2>
                        
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">الخصوم المتداولة</h3>
                            <div className="space-y-1">
                                {liabilities.current.map((a: any) => (
                                    <div key={a.id} className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                        <span>{a.code} - {a.name}</span>
                                        <span className="font-semibold">{a.balance.toLocaleString()} SAR</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">خصوم طويلة الأجل</h3>
                            <div className="space-y-1">
                                {liabilities.longTerm.map((a: any) => (
                                    <div key={a.id} className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                        <span>{a.code} - {a.name}</span>
                                        <span className="font-semibold">{a.balance.toLocaleString()} SAR</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">إجمالي الخصوم</span>
                            <span className="font-bold text-lg text-red-600 dark:text-red-400">{liabilities.total.toLocaleString()} SAR</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2">{_t('حقوق الملكية (حقوق ملكية)', 'حقوق الملكية (Equity)')}</h2>
                        
                        <div className="space-y-1">
                            {equity.items.map((a: any) => (
                                <div key={a.id} className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                    <span>{a.code} - {a.name}</span>
                                    <span className="font-semibold">{a.balance.toLocaleString()} SAR</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">إجمالي حقوق الملكية</span>
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">{equity.total.toLocaleString()} SAR</span>
                        </div>
                    </div>

                    {/* Check Equation */}
                    <div className={`p-4 rounded-lg shadow-sm font-bold text-center border-2 ${Math.abs(assets.total - (liabilities.total + equity.total)) < 0.1 ? 'bg-green-100 text-green-800 border-green-500' : 'bg-red-100 text-red-800 border-red-500'}`}>
                        {Math.abs(assets.total - (liabilities.total + equity.total)) < 0.1 
                            ? '✅ الميزانية متوازنة (الأصول = الخصوم + حقوق الملكية)' 
                            : `❌ الميزانية غير متوازنة! الفارق: ${Math.abs(assets.total - (liabilities.total + equity.total)).toLocaleString()} SAR`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
