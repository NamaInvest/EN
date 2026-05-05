'use client';

import React, { useState, useEffect } from 'react';

export default function PaymentRunPage() {
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedRun, setSelectedRun] = useState<any>(null);
    const [generatedXml, setGeneratedXml] = useState<string | null>(null);

    const [proposal, setProposal] = useState({
        dueBefore: new Date().toISOString().split('T')[0],
        currency: 'SAR',
        bankAccountId: '1'
    });

    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/payment-run');
            const data = await res.json();
            setRuns(data.data || []);
        } finally {
            setLoading(false);
        }
    };

    const handlePropose = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/finance/payment-run/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposal)
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                fetchRuns();
            } else {
                alert(data.error || 'فشلت عملية إنشاء الدورة');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: string) => {
        if (!confirm(`هل أنت متأكد من تنفيذ: ${action}؟`)) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/payment-run/${id}/${action}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                if (action === 'send-bank' && data.xml) {
                    setGeneratedXml(data.xml);
                }
                fetchRuns();
            } else {
                alert(data.error || 'فشلت العملية');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PROPOSED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">مقترح</span>;
            case 'APPROVED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">معتمد</span>;
            case 'SENT_TO_BANK': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">تم الإرسال للبنك</span>;
            case 'POSTED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">مدفوع ومرحل</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة دورات الدفع (Payment Run)</h1>
                    <p className="text-gray-500 mt-1">تجميع الفواتير المستحقة، اعتمادها مجمعة، وإصدار ملفات تحويل البنك (SARIE/SAMA)</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold"
                >
                    + إنشاء دورة دفع مقترحة
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {loading && <div className="mb-4 text-blue-600">جاري المعالجة...</div>}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">رقم الدورة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الاستحقاق</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">العملة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">المبلغ الإجمالي</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">عدد الموردين</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {runs.map((r: any) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{r.runNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.dueDateUntil).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.currency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{Number(r.totalAmount).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{r.totalCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(r.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2 rtl:space-x-reverse">
                                        {r.status === 'PROPOSED' && (
                                            <button onClick={() => handleAction(r.id, 'approve')} className="text-blue-600 hover:text-blue-900 font-bold">اعتماد مالي</button>
                                        )}
                                        {r.status === 'APPROVED' && (
                                            <button onClick={() => handleAction(r.id, 'send-bank')} className="text-purple-600 hover:text-purple-900 font-bold">إصدار ملف البنك</button>
                                        )}
                                        {r.status === 'SENT_TO_BANK' && (
                                            <button onClick={() => handleAction(r.id, 'confirm')} className="text-green-600 hover:text-green-900 font-bold">تأكيد التسوية (ترحيل)</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {runs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد دورات دفع مسجلة.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* XML Result Modal */}
            {generatedXml && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold dark:text-white">ملف البنك (SARIE XML)</h2>
                            <button onClick={() => setGeneratedXml(null)} className="text-gray-500 hover:text-red-500">✕</button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">يُستخدم هذا الملف للرفع على منصة البنك لإجراء التحويلات المجمعة تلقائياً.</p>
                        <div className="flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap">
                            {generatedXml}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedXml);
                                    alert('تم نسخ المحتوى');
                                }} 
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                            >
                                نسخ المحتوى
                            </button>
                            <button onClick={() => setGeneratedXml(null)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Propose Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">إنشاء دورة دفع جديدة مقترحة</h2>
                        <form onSubmit={handlePropose} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الاستحقاق حتى</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    value={proposal.dueBefore}
                                    onChange={e => setProposal({...proposal, dueBefore: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الحساب البنكي (Source Account)</label>
                                <select 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    value={proposal.bankAccountId}
                                    onChange={e => setProposal({...proposal, bankAccountId: e.target.value})}
                                >
                                    <option value="1">البنك الأهلي السعودي - جاري</option>
                                    <option value="2">مصرف الراجحي - جاري</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العملة</label>
                                <select 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    value={proposal.currency}
                                    onChange={e => setProposal({...proposal, currency: e.target.value})}
                                >
                                    <option value="SAR">ريال سعودي (SAR)</option>
                                    <option value="USD">دولار أمريكي (USD)</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700">إلغاء</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حفظ واقتراح</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
