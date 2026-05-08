'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const listSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    currency: z.string().min(1, 'Currency is required'),
    validFrom: z.string().min(1, 'Valid From is required'),
    validTo: z.string().optional().nullable(),
    priority: z.number()
});

const testSchema = z.object({
    testProductId: z.number().min(1, 'Product ID is required'),
    testQty: z.number().min(0.01, 'Quantity is required'),
    testCustomerId: z.number().optional().nullable()
});

type ListFormValues = z.infer<typeof listSchema>;
type TestFormValues = z.infer<typeof testSchema>;

export default function PricingEnginePage() {
    const { lang } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [priceLists, setPriceLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewListModal, setShowNewListModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);

    const [testResult, setTestResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const { register: registerList, handleSubmit: handleSubmitList, reset: resetList, formState: { errors: listErrors } } = useForm<ListFormValues>({
        resolver: zodResolver(listSchema),
        defaultValues: {
            name: '',
            currency: 'SAR',
            validFrom: '',
            validTo: '',
            priority: 0
        }
    });

    const { register: registerTest, handleSubmit: handleSubmitTest, reset: resetTest, formState: { errors: testErrors } } = useForm<TestFormValues>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            testProductId: undefined,
            testQty: 1,
            testCustomerId: undefined
        }
    });

    useEffect(() => {
        fetchPriceLists();
    }, []);

    const fetchPriceLists = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales/pricing');
            if (res.ok) {
                const data = await res.json();
                setPriceLists(data);
            }
        } catch (error) {
            console.error('Failed to fetch price lists', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async (data: ListFormValues) => {
        setSaving(true);
        try {
            const res = await fetch('/api/sales/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    currency: data.currency,
                    validFrom: data.validFrom,
                    validTo: data.validTo || null,
                    priority: data.priority
                })
            });
            if (res.ok) {
                setShowNewListModal(false);
                fetchPriceLists();
                resetList();
                toastSuccess('تم إنشاء قائمة الأسعار بنجاح');
            } else {
                toastError('فشل في إنشاء قائمة الأسعار');
            }
        } catch (error) {
            console.error(error);
            toastError('حدث خطأ أثناء الاتصال بالخادم');
        } finally {
            setSaving(false);
        }
    };

    const handleTestPricing = async (data: TestFormValues) => {
        setTesting(true);
        try {
            const res = await fetch('/api/sales/pricing/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: data.testProductId,
                    qty: data.testQty,
                    customerId: data.testCustomerId || null,
                })
            });
            const resData = await res.json();
            setTestResult(resData);
        } catch (error) {
            console.error(error);
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">محرك الأسعار (Pricing Engine)</h1>
                    <p className="text-gray-500 mt-1">إدارة قوائم الأسعار المتقدمة والقواعد الشرطية</p>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button onClick={() => setShowTestModal(true)} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        اختبار التسعير
                    </button>
                    <button onClick={() => setShowNewListModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        + قائمة جديدة
                    </button>
                </div>
            </div>

            {/* Price Lists Grid */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم القائمة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العملة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفعالية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد القواعد</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {priceLists.map((list) => (
                            <tr key={list.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{list.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{list.currency}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(list.validFrom).toLocaleDateString()} {list.validTo ? `إلى ${new Date(list.validTo).toLocaleDateString()}` : ''}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{list.priority}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{list._count?.rules || 0} قواعد</td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 ml-3">إضافة قاعدة</button>
                                    <button className="text-gray-600 hover:text-gray-900">تعديل</button>
                                </td>
                            </tr>
                        ))}
                        {priceLists.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">لا توجد قوائم أسعار</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* New List Modal */}
            {showNewListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] shadow-xl">
                        <h2 className="text-lg font-bold mb-4 dark:text-white">إنشاء قائمة أسعار جديدة</h2>
                        <form onSubmit={handleSubmitList(handleCreateList)}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم القائمة</label>
                                    <input type="text" className={`mt-1 block w-full border ${listErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white`} {...registerList('name')} />
                                    {listErrors.name && <span className="text-red-500 text-xs mt-1 block">{listErrors.name.message}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صالح من</label>
                                        <input type="date" className={`mt-1 block w-full border ${listErrors.validFrom ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white`} {...registerList('validFrom')} />
                                        {listErrors.validFrom && <span className="text-red-500 text-xs mt-1 block">{listErrors.validFrom.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صالح إلى (اختياري)</label>
                                        <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" {...registerList('validTo')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العملة</label>
                                        <input type="text" className={`mt-1 block w-full border ${listErrors.currency ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white`} {...registerList('currency')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الأولوية (أعلى = أهم)</label>
                                        <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" {...registerList('priority', { valueAsNumber: true })} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                                <button type="button" onClick={() => setShowNewListModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">إلغاء</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md" disabled={saving}>{saving ? 'جاري الحفظ' : 'حفظ'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Pricing Modal */}
            {showTestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] shadow-xl">
                        <h2 className="text-lg font-bold mb-4 dark:text-white">اختبار محرك التسعير</h2>
                        <form onSubmit={handleSubmitTest(handleTestPricing)}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم المنتج (ID)</label>
                                    <input type="number" className={`mt-1 block w-full border ${testErrors.testProductId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:text-white`} {...registerTest('testProductId', { valueAsNumber: true })} />
                                    {testErrors.testProductId && <span className="text-red-500 text-xs mt-1 block">{testErrors.testProductId.message}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الكمية</label>
                                        <input type="number" step="any" className={`mt-1 block w-full border ${testErrors.testQty ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:text-white`} {...registerTest('testQty', { valueAsNumber: true })} />
                                        {testErrors.testQty && <span className="text-red-500 text-xs mt-1 block">{testErrors.testQty.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم العميل (اختياري)</label>
                                        <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-gray-700 dark:text-white" {...registerTest('testCustomerId', { valueAsNumber: true, setValueAs: v => v === '' ? undefined : parseInt(v, 10) })} />
                                    </div>
                                </div>
                                
                                {testResult && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">نتيجة الاختبار:</h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <p>السعر النهائي: <span className="font-bold text-green-600">{testResult.unitPrice}</span></p>
                                            {testResult.discountPct > 0 && <p>الخصم: %{testResult.discountPct}</p>}
                                            <p>القائمة المطبقة: {testResult.priceListName || 'السعر الافتراضي'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                                <button type="button" onClick={() => { setShowTestModal(false); setTestResult(null); resetTest(); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">إغلاق</button>
                                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md" disabled={testing}>{testing ? 'جاري التشغيل...' : 'تشغيل الاختبار'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
