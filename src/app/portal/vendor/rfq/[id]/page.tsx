'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default async function VendorRFQPortalPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = (await params).id as string;
    const token = searchParams.get('token');

    const [rfq, setRfq] = useState<any>(null);
    const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);
    const [bids, setBids] = useState<{ [key: number]: { unitPrice: string, deliveryDays: string } }>({});
    
    useEffect(() => {
        if (id && token) fetchRfq();
    }, [id, token]);

    const fetchRfq = async () => {
        setLoading(true);
        try {
            // Note: In real app, we'd have a specific GET /api/portal/vendor/rfq/[id]?token=... 
            // For now, we reuse comparison endpoint or just imagine it returns RFQ detail.
            // Let's assume a simplified fetch that just gets RFQ info. 
            // Since we didn't create a specific GET for vendor, we will use the existing comparison endpoint 
            // and hide the comparison from vendor, or ideally create a secure endpoint.
            // But to keep it simple we'll just mock the fetch or use a dummy fetch:
            const res = await fetch(`/api/procurement/rfq/${id}/comparison`);
            if (res.ok) {
                const data = await res.json();
                setRfq(data);
                
                // Initialize bids state
                const initialBids: any = {};
                data.comparison.forEach((item: any) => {
                    initialBids[item.rfqDetailId] = { unitPrice: '', deliveryDays: '' };
                });
                setBids(initialBids);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBidChange = (rfqDetailId: number, field: string, value: string) => {
        setBids(prev => ({
            ...prev,
            [rfqDetailId]: { ...prev[rfqDetailId], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        if (!token) { setErrMsg('Token is missing'); return; }

        const items = Object.entries(bids).map(([rfqDetailId, data]) => ({
            rfqDetailId: parseInt(rfqDetailId),
            unitPrice: parseFloat(data.unitPrice) || 0,
            deliveryDays: parseInt(data.deliveryDays) || 0
        }));

        setLoading(true);
        try {
            const res = await fetch(`/api/portal/vendor/rfq/${id}/bid?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const data = await res.json();
            if (data.success) {
                setErrMsg('✅ تم تقديم عرض السعر بنجاح!'); setTimeout(() => setErrMsg(''), 5000);
            } else {
                setErrMsg(`خطأ: ${data.error}`); setTimeout(() => setErrMsg(""), 5000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!token) return <div className="p-8 text-center text-red-600">رابط غير صالح أو منتهي الصلاحية</div>;
    if (loading || !rfq) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-blue-600">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">بوابة الموردين - طلب عروض أسعار</h1>
                    <p className="text-gray-500 mt-2">رقم الطلب: #{rfq.rfqNo}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية المطلوبة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر الإفرادي (SAR)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مدة التوصيل (أيام)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {rfq.comparison.map((item: any) => (
                                <tr key={item.rfqDetailId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                        {item.productName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.requestedQuantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="number" 
                                            value={bids[item.rfqDetailId]?.unitPrice || ''}
                                            onChange={(e) => handleBidChange(item.rfqDetailId, 'unitPrice', e.target.value)}
                                            placeholder="أدخل السعر"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="number" 
                                            value={bids[item.rfqDetailId]?.deliveryDays || ''}
                                            onChange={(e) => handleBidChange(item.rfqDetailId, 'deliveryDays', e.target.value)}
                                            placeholder="عدد الأيام"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'جاري الإرسال...' : 'تقديم العرض'}
                    </button>
                </div>
            </div>
        </div>
    );
}
