'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function ThreeWayMatchPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess, warning: toastWarning } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'ALL' | 'MATCHED' | 'EXCEPTIONS' | 'OVERRIDDEN'>('EXCEPTIONS');
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [overrideNotes, setOverrideNotes] = useState('');

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/purchases/matching');
            const data = await res.json();
            setMatches(data.data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoMatch = async () => {
        if (!confirm('هل تريد تشغيل محرك المطابقة الثلاثية للفواتير المعلقة؟')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/purchases/matching', { method: 'POST' });
            const data = await res.json();
            toastSuccess(`تم تشغيل المطابقة بنجاح. تمت معالجة ${data.processed} فاتورة.`);
            fetchMatches();
        } catch (e) {
            console.error(e);
            toastError('حدث خطأ أثناء تشغيل المطابقة');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (override: boolean) => {
        if (!overrideNotes && override) {
            toastWarning('يجب إدخال ملاحظات لتجاوز المطابقة');
            return;
        }

        try {
            const res = await fetch(`/api/purchases/matching/${selectedMatch.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolutionNotes: overrideNotes, override })
            });

            if (res.ok) {
                toastSuccess(override ? 'تم تجاوز الاستثناء والموافقة على الدفع' : 'تم إضافة الملاحظات بنجاح');
                setSelectedMatch(null);
                setOverrideNotes('');
                fetchMatches();
            } else {
                toastError('فشلت العملية');
            }
        } catch (error) {
            console.error(error);
            toastError('حدث خطأ غير متوقع');
        }
    };

    const filteredMatches = matches.filter(m => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'MATCHED') return m.matchStatus === 'MATCHED';
        if (activeTab === 'EXCEPTIONS') return ['PRICE_HOLD', 'QTY_HOLD', 'BOTH_HOLD', 'MANUAL_REVIEW'].includes(m.matchStatus);
        if (activeTab === 'OVERRIDDEN') return m.matchStatus === 'OVERRIDDEN';
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'MATCHED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">متطابق</span>;
            case 'PRICE_HOLD': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">تجاوز سعر</span>;
            case 'QTY_HOLD': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">تجاوز كمية</span>;
            case 'BOTH_HOLD': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">تجاوز كلي</span>;
            case 'MANUAL_REVIEW': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">قيد المراجعة</span>;
            case 'OVERRIDDEN': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">متجاوز يدوياً</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المطابقة الثلاثية (Three-Way Matching)</h1>
                    <p className="text-gray-500 mt-1">{_t('مطابقة فواتير الموردين مع أوامر الشراء وسندات الاستلام (PO, GRN, فاتورة)', 'مطابقة فواتير الموردين مع أوامر الشراء وسندات الاستلام (PO, GRN, Invoice)')}</p>
                </div>
                <button 
                    onClick={handleAutoMatch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    disabled={loading}
                >
                    {loading ? 'جاري التشغيل...' : 'تشغيل المطابقة التلقائية'}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex -mb-px px-6" aria-label="Tabs">
                        {['EXCEPTIONS', 'MATCHED', 'OVERRIDDEN', 'ALL'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`${
                                    activeTab === tab
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                                } whitespace-nowrap py-4 px-8 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {tab === 'EXCEPTIONS' && 'استثناءات (مرفوضة)'}
                                {tab === 'MATCHED' && 'مطابقة تلقائياً'}
                                {tab === 'OVERRIDDEN' && 'تم التجاوز'}
                                {tab === 'ALL' && 'الكل'}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">جاري التحميل...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">فاتورة رقم</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">أمر الشراء (PO)</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">المورد</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">حالة المطابقة</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">حالة الدفع</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">فرق السعر</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">فرق الكمية</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">تفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredMatches.map((m) => (
                                        <tr key={m.id} className={m.paymentBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">INV-{m.invoiceId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PO-{m.purchaseOrderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.invoice?.supplier?.name || 'غير معروف'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(m.matchStatus)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {m.paymentBlocked ? (
                                                    <span className="text-red-600 font-bold text-xs">محظور (Blocked)</span>
                                                ) : (
                                                    <span className="text-green-600 font-bold text-xs">متاح (Cleared)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                {m.priceVariancePercent > 0 ? (
                                                    <span className="text-red-500">{Number(m.priceVariancePercent).toFixed(2)}% ({m.priceVariance})</span>
                                                ) : <span className="text-green-500">0%</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                {m.quantityVariancePercent > 0 ? (
                                                    <span className="text-red-500">{Number(m.quantityVariancePercent).toFixed(2)}% ({m.quantityVariance})</span>
                                                ) : <span className="text-green-500">0%</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <button onClick={() => setSelectedMatch(m)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400">مراجعة</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMatches.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">لا توجد سجلات مطابقة في هذا التصنيف.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Resolution Modal */}
            {selectedMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold dark:text-white">تفاصيل مطابقة الفاتورة INV-{selectedMatch.invoiceId}</h2>
                            {getStatusBadge(selectedMatch.matchStatus)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="font-bold mb-2 dark:text-white">إجماليات أمر الشراء (PO)</h3>
                                <p className="text-sm dark:text-gray-300">المبلغ: {selectedMatch.poTotalAmount}</p>
                                <p className="text-sm dark:text-gray-300">الكمية: {selectedMatch.poTotalQuantity}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="font-bold mb-2 dark:text-white">{_t('إجماليات الفاتورة (فاتورة)', 'إجماليات الفاتورة (Invoice)')}</h3>
                                <p className="text-sm dark:text-gray-300">المبلغ: {selectedMatch.invoiceTotalAmount}</p>
                                <p className="text-sm dark:text-gray-300">الكمية: {selectedMatch.invoiceTotalQuantity}</p>
                            </div>
                        </div>

                        <h3 className="font-bold mb-2 dark:text-white">تفاصيل الأصناف</h3>
                        <table className="w-full text-sm text-right mb-6 text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="py-2 px-4">رقم الصنف</th>
                                    <th className="py-2 px-4">كمية PO</th>
                                    <th className="py-2 px-4">كمية استلام GRN</th>
                                    <th className="py-2 px-4">كمية فاتورة</th>
                                    <th className="py-2 px-4 text-center">مطابقة كمية؟</th>
                                    <th className="py-2 px-4 text-center">مطابقة سعر؟</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMatch.lines?.map((l: any) => (
                                    <tr key={l.id} className="border-b dark:border-gray-600">
                                        <td className="py-2 px-4">{l.productId}</td>
                                        <td className="py-2 px-4">{l.poQuantity}</td>
                                        <td className="py-2 px-4">{l.grnQuantity}</td>
                                        <td className="py-2 px-4 text-red-600 font-bold">{l.invoiceQuantity}</td>
                                        <td className="py-2 px-4 text-center">{l.qtyMatched ? '✅' : '❌'}</td>
                                        <td className="py-2 px-4 text-center">{l.priceMatched ? '✅' : '❌'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {selectedMatch.paymentBlocked && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات التجاوز أو المراجعة</label>
                                    <textarea 
                                        value={overrideNotes} 
                                        onChange={e => setOverrideNotes(e.target.value)} 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white" 
                                        rows={3}
                                        placeholder="اكتب سبب تجاوز هذا الاستثناء والسماح بالدفع للمورد..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                                    <button type="button" onClick={() => setSelectedMatch(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700">إلغاء</button>
                                    <button type="button" onClick={() => handleResolve(false)} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">حفظ الملاحظات فقط</button>
                                    <button type="button" onClick={() => handleResolve(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">تجاوز (Override) والسماح بالدفع</button>
                                </div>
                            </div>
                        )}
                        
                        {!selectedMatch.paymentBlocked && (
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setSelectedMatch(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">إغلاق</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
