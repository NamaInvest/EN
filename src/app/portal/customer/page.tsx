'use client';

import React, { useState, useEffect } from 'react';

export default function CustomerPortalPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/portal/customer');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-blue-600 font-bold">جاري تحميل بوابة العميل...</div>;
    if (!data?.customer) return <div className="p-8 text-center text-red-600">عفواً، لا يوجد عملاء في قاعدة البيانات.</div>;

    const { customer, metrics, orders, invoices } = data;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                {customer.name.charAt(0)}
                            </div>
                            <span className="font-bold text-lg text-gray-900 dark:text-white">بوابة العميل ({customer.name})</span>
                        </div>
                        <div className="text-sm text-gray-500 flex gap-4">
                            <a href="#" className="hover:text-blue-600">الدعم الفني</a>
                            <a href="#" className="hover:text-red-600">تسجيل الخروج</a>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-red-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">الفواتير المستحقة (SAR)</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalOutstanding.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">الطلبات الأخيرة</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{metrics.ordersCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-green-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">حالة الحساب</h3>
                        <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">نشط</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700 flex">
                        <button 
                            className={`px-6 py-4 font-bold text-sm focus:outline-none ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            تتبع الطلبات (Orders)
                        </button>
                        <button 
                            className={`px-6 py-4 font-bold text-sm focus:outline-none ${activeTab === 'invoices' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            onClick={() => setActiveTab('invoices')}
                        >
                            الفواتير والكشوفات (Invoices)
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {orders.map((o: any) => (
                                    <div key={o.id} className="border dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">طلب رقم #{o.orderNo}</div>
                                            <div className="text-sm text-gray-500 mt-1">{new Date(o.date).toLocaleDateString('ar-SA')}</div>
                                        </div>
                                        <div className="flex-1 max-w-md w-full">
                                            {/* Progress Bar (Mocked based on status) */}
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                                <span className={o.status === 'pending' || o.status === 'approved' || o.status === 'delivered' ? 'text-blue-600' : ''}>مؤكد</span>
                                                <span className={o.status === 'approved' || o.status === 'delivered' ? 'text-blue-600' : ''}>قيد التجهيز</span>
                                                <span className={o.status === 'delivered' ? 'text-blue-600' : ''}>تم التوصيل</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex flex-row-reverse">
                                                <div className={`h-full bg-blue-600 transition-all ${o.status === 'pending' ? 'w-1/3' : o.status === 'approved' ? 'w-2/3' : o.status === 'delivered' ? 'w-full' : 'w-0'}`}></div>
                                            </div>
                                        </div>
                                        <div className="text-left rtl:text-right">
                                            <div className="font-bold text-gray-900 dark:text-white">{o.total.toLocaleString()} SAR</div>
                                            <button className="mt-1 text-xs text-blue-600 hover:underline font-bold">تفاصيل الطلب</button>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && <div className="text-center text-gray-500 py-8">لا توجد طلبات سابقة.</div>}
                            </div>
                        )}

                        {activeTab === 'invoices' && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {invoices.map((inv: any) => (
                                            <tr key={inv.id}>
                                                <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">INV-{inv.invoiceNo}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-white">{inv.total.toLocaleString()} SAR</td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center space-x-2 space-x-reverse">
                                                    <button className="text-blue-600 hover:text-blue-900 font-bold text-sm border border-blue-600 px-3 py-1 rounded">
                                                        📄 تحميل (PDF/QR)
                                                    </button>
                                                    {inv.status !== 'paid' && (
                                                        <button className="text-white bg-green-600 hover:bg-green-700 font-bold text-sm px-3 py-1 rounded shadow">
                                                            💳 دفع الآن
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {invoices.length === 0 && <div className="text-center text-gray-500 py-8">لا توجد فواتير مستحقة.</div>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
