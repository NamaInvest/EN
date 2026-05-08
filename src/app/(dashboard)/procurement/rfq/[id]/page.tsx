'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default async function RFQDetailPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const params = useParams();
    const id = (await params).id as string;
    
    const [comparisonData, setComparisonData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) fetchComparison();
    }, [id]);

    const fetchComparison = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/procurement/rfq/${id}/comparison`);
            if (res.ok) {
                setComparisonData(await res.json());
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAward = async (vendorId: number) => {
        if (!confirm('هل أنت متأكد من الترسية على هذا المورد وإصدار أمر شراء؟')) return;
        
        try {
            const res = await fetch(`/api/procurement/rfq/${id}/award`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId })
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess(`تم الترسية بنجاح! رقم أمر الشراء: ${data.poId}`);
                fetchComparison();
            } else {
                toastError(`خطأ: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleInvite = async () => {
        const vendorIds = prompt('أدخل معرفات الموردين مفصولة بفاصلة (مثال: 1,2,3):');
        if (!vendorIds) return;
        
        const idsArray = vendorIds.split(',').map(v => parseInt(v.trim()));
        try {
            const res = await fetch(`/api/procurement/rfq/${id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorIds: idsArray })
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess(`تم إرسال دعوات لـ ${data.tokens} موردين بنجاح.`);
                fetchComparison();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;
    if (!comparisonData) return <div className="p-8">لا يوجد بيانات</div>;

    const { rfqNo, status, comparison, ranking } = comparisonData;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تفاصيل طلب عروض أسعار #{rfqNo}</h1>
                    <p className="text-gray-500 mt-1">الحالة: {status}</p>
                </div>
                <div className="space-x-2 rtl:space-x-reverse">
                    <button 
                        onClick={handleInvite}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        إرسال دعوات للموردين
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">مصفوفة المقارنة (Comparison Matrix)</h2>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase border-l border-gray-300 dark:border-gray-700">السعر المستهدف</th>
                                
                                {ranking.map((vendor: any) => (
                                    <th key={vendor.vendorId} className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white border-l border-gray-300 dark:border-gray-700">
                                        {vendor.vendorName}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {comparison.map((item: any) => (
                                <tr key={item.rfqDetailId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.requestedQuantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-l border-gray-300 dark:border-gray-700">{item.targetPrice || '-'} SAR</td>
                                    
                                    {ranking.map((vendor: any) => {
                                        const vendorBid = item.bids.find((b: any) => b.vendorId === vendor.vendorId);
                                        return (
                                            <td key={vendor.vendorId} className={`px-6 py-4 text-center whitespace-nowrap text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${vendorBid?.isBestPrice ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                {vendorBid?.unitPrice ? `${vendorBid.unitPrice.toLocaleString()} SAR` : '-'}
                                                <div className="text-xs text-gray-500 font-normal">
                                                    {vendorBid?.deliveryDays ? `${vendorBid.deliveryDays} يوم توصيل` : ''}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-900 font-bold">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-left border-l border-gray-300 dark:border-gray-700">الإجمالي (Total Cost)</td>
                                {ranking.map((vendor: any) => (
                                    <td key={vendor.vendorId} className="px-6 py-4 text-center border-l border-gray-300 dark:border-gray-700">
                                        <div className="text-lg text-blue-600 dark:text-blue-400">
                                            {vendor.totalAmount.toLocaleString()} SAR
                                        </div>
                                        <div className="mt-2">
                                            <button 
                                                onClick={() => handleAward(vendor.vendorId)}
                                                disabled={status === 'closed'}
                                                className="w-full bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                            >
                                                الترسية (Award)
                                            </button>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
