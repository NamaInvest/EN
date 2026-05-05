'use client';

import React, { useState, useEffect } from 'react';

export default function SupplierContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [newContract, setNewContract] = useState({
        supplierId: '1',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        value: '',
        currency: 'SAR',
        paymentTerms: '',
        autoRenew: false,
        alertDaysBefore: 30
    });

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/procurement/contracts');
            const data = await res.json();
            setContracts(data.data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/procurement/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContract)
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                fetchContracts();
                
                // ZATCA VAT Check simulation
                if (Number(newContract.value) > 100000 && newContract.currency === 'SAR') {
                    alert('تنبيه ZATCA: قيمة العقد تتجاوز 100,000 ريال سعودي. يرجى التأكد من تسجيل المورد في ضريبة القيمة المضافة.');
                }
            } else {
                alert(data.error || 'فشل إضافة العقد');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunCron = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cron/contracts');
            const data = await res.json();
            alert(`تنبيهات مولدة: ${data.alertsGenerated}\nتم التجديد التلقائي: ${data.autoRenewed}`);
            fetchContracts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (endDateStr: string) => {
        const today = new Date();
        const endDate = new Date(endDateStr);
        const diffTime = endDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 3600 * 24));
    };

    const getStatusBadge = (status: string, endDateStr: string) => {
        if (status === 'expired') return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">منتهي</span>;
        if (status === 'terminated') return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">ملغى</span>;
        
        const days = getDaysRemaining(endDateStr);
        if (days <= 30 && days > 0) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">قارب على الانتهاء ({days} يوم)</span>;
        if (days <= 0) return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">انتهى قبل ({Math.abs(days)} يوم)</span>;
        
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">ساري</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة عقود الموردين (Supplier Contracts)</h1>
                    <p className="text-gray-500 mt-1">تتبع دورة حياة العقود، التجديد التلقائي، وامتثال ZATCA</p>
                </div>
                <div className="space-x-2 rtl:space-x-reverse">
                    <button 
                        onClick={handleRunCron}
                        className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        تحديث وتنبيه (Cron)
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold"
                    >
                        + عقد جديد
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {loading && <div className="mb-4 text-blue-600">جاري التحميل...</div>}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">رقم العقد</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">المورد</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">عنوان العقد</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">القيمة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {contracts.map((c: any) => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{c.contractNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{c.supplier?.name || 'غير معروف'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{new Date(c.endDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        {Number(c.value).toLocaleString()} {c.currency}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(c.status, c.endDate)}
                                    </td>
                                </tr>
                            ))}
                            {contracts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">لا توجد عقود مسجلة.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Contract Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">تسجيل عقد مورد جديد</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المورد</label>
                                    <select 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.supplierId}
                                        onChange={e => setNewContract({...newContract, supplierId: e.target.value})}
                                    >
                                        <option value="1">شركة التوريدات الحديثة</option>
                                        <option value="2">مؤسسة الأفق للتجارة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">عنوان العقد</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.title}
                                        onChange={e => setNewContract({...newContract, title: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ البداية</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.startDate}
                                        onChange={e => setNewContract({...newContract, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الانتهاء</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.endDate}
                                        onChange={e => setNewContract({...newContract, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">القيمة الإجمالية للعقد</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.value}
                                        onChange={e => setNewContract({...newContract, value: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">شروط الدفع (Payment Terms)</label>
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                        value={newContract.paymentTerms}
                                        onChange={e => setNewContract({...newContract, paymentTerms: e.target.value})}
                                        placeholder="Net 30, Net 60..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 rtl:space-x-reverse pt-2">
                                <label className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <input 
                                        type="checkbox" 
                                        checked={newContract.autoRenew}
                                        onChange={e => setNewContract({...newContract, autoRenew: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تجديد تلقائي (Auto-Renew)</span>
                                </label>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <span className="text-sm text-gray-500">التنبيه قبل</span>
                                    <input 
                                        type="number" 
                                        className="w-16 border-gray-300 rounded-md shadow-sm p-1 text-center dark:bg-gray-700 dark:text-white"
                                        value={newContract.alertDaysBefore}
                                        onChange={e => setNewContract({...newContract, alertDaysBefore: Number(e.target.value)})}
                                    />
                                    <span className="text-sm text-gray-500">يوم</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات / وصف عام</label>
                                <textarea 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    value={newContract.description}
                                    onChange={e => setNewContract({...newContract, description: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700">إلغاء</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">اعتماد وحفظ العقد</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
