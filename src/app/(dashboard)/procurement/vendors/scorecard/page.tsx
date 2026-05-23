'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function VendorScorecardPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [scorecards, setScorecards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'ALERTS'>('LEADERBOARD');
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [newRating, setNewRating] = useState({ supplierId: '', quality: '5', delivery: '5', pricing: '5', notes: '' });

    useEffect(() => {
        fetchScorecards();
    }, []);

    const fetchScorecards = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/procurement/vendors/scorecard');
            if (res.ok) {
                const data = await res.json();
                setScorecards(data.data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/procurement/vendors/scorecard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRating)
            });
            if (res.ok) {
                toastSuccess('تم تسجيل التقييم بنجاح');
                setShowRatingModal(false);
                fetchScorecards();
            } else {
                toastError('خطأ أثناء تسجيل التقييم');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBlockVendor = (vendorName: string) => {
        if (confirm(`هل أنت متأكد من حظر المورد ${vendorName}؟ لن يتمكن من تلقي أوامر شراء جديدة.`)) {
            toastSuccess(`تم حظر المورد: ${vendorName}`);
            // Call block API in reality
        }
    };

    const handleRunCron = async () => {
        if (!confirm('هل تريد تشغيل وظيفة التقييم الليلية (Cron Job) الآن لتحديث التقييمات؟')) return;
        try {
            const res = await fetch('/api/cron/vendor-scoring');
            const data = await res.json();
            toastSuccess(`تم تشغيل التحديث بنجاح. معالجة ${data.processed} مورد.`);
            fetchScorecards();
        } catch (e) {
            console.error(e);
        }
    };

    const alerts = scorecards.filter(s => s.compositeScore < 60);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">أداء وتقييم الموردين (Vendor Scorecard)</h1>
                    <p className="text-gray-500 mt-1">مؤشرات الأداء الرئيسية: الجودة، التوصيل في الموعد (OTD)، والأسعار</p>
                </div>
                <div className="space-x-2 rtl:space-x-reverse">
                    <button 
                        onClick={() => setShowRatingModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        تقييم يدوي
                    </button>
                    <button 
                        onClick={handleRunCron}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                        تشغيل معالج التقييمات
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex -mb-px px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('LEADERBOARD')}
                            className={`${
                                activeTab === 'LEADERBOARD'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-8 border-b-2 font-medium text-sm transition-colors`}
                        >
                            لوحة الصدارة (Leaderboard)
                        </button>
                        <button
                            onClick={() => setActiveTab('ALERTS')}
                            className={`${
                                activeTab === 'ALERTS'
                                    ? 'border-red-500 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-8 border-b-2 font-medium text-sm transition-colors`}
                        >
                            التنبيهات والمخاطر ({alerts.length})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">جاري التحميل...</div>
                    ) : activeTab === 'LEADERBOARD' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الترتيب</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الجودة (جودة)', 'الجودة (Quality)')}</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">التوصيل (OTD)</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الأسعار (Pricing)</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">التقييم الشامل</th>
                                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {scorecards.map((score, index) => (
                                        <tr key={score.supplierId} className={score.compositeScore < 60 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">#{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{score.vendorName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${score.quality}%`}}></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{score.quality}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${score.otd}%`}}></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{score.otd}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{width: `${score.pricing}%`}}></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{score.pricing}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                                                    score.compositeScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    score.compositeScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {score.compositeScore}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                <button onClick={() => handleBlockVendor(score.vendorName)} className="text-red-600 hover:text-red-900">حظر</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {scorecards.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">لا توجد تقييمات مسجلة للموردين.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-8 text-green-600 font-medium">لا توجد تنبيهات! جميع الموردين يتجاوزون نسبة التقييم المطلوبة.</div>
                            ) : (
                                alerts.map(score => (
                                    <div key={score.supplierId} className="flex justify-between items-center p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                            <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-red-800 dark:text-red-400">{score.vendorName}</h4>
                                                <p className="text-sm text-red-600 dark:text-red-300">
                                                    انخفض التقييم الشامل عن 60% (الحالي: {score.compositeScore}%). ينصح بإيقاف التعامل مؤقتاً.
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleBlockVendor(score.vendorName)}
                                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                        >
                                            حظر المورد
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">تقييم مورد جديد</h2>
                        <form onSubmit={handleRateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{_t('رقم تعريف المورد (مورد المعرف)', 'رقم تعريف المورد (Supplier ID)')}</label>
                                <input required type="number" value={newRating.supplierId} onChange={e => setNewRating({...newRating, supplierId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الجودة (1-5)</label>
                                    <input required type="number" min="1" max="5" value={newRating.quality} onChange={e => setNewRating({...newRating, quality: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">التوصيل (1-5)</label>
                                    <input required type="number" min="1" max="5" value={newRating.delivery} onChange={e => setNewRating({...newRating, delivery: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الأسعار (1-5)</label>
                                    <input required type="number" min="1" max="5" value={newRating.pricing} onChange={e => setNewRating({...newRating, pricing: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات (اختياري)</label>
                                <textarea value={newRating.notes} onChange={e => setNewRating({...newRating, notes: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" rows={3}></textarea>
                            </div>
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                                <button type="button" onClick={() => setShowRatingModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حفظ التقييم</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
