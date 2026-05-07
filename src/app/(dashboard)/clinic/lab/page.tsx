'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function LabIntegrationPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [orders, setOrders] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [labTests, setLabTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState<any>(null); // holds the order object being edited

    // Form states
    const [patientId, setPatientId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clinic/lab`);
            const json = await res.json();
            if (json.success) {
                setOrders(json.data.orders);
                setDoctors(json.data.metadata.doctors);
                setPatients(json.data.metadata.patients);
                
                // Add mock tests if DB is empty for demo purposes
                if (json.data.metadata.labTests.length === 0) {
                    setLabTests([
                        { id: 101, code: 'CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', normalRange: 'WBC: 4.5-11.0, RBC: 4.5-5.9', unit: 'x10^9/L' },
                        { id: 102, code: 'LIPID', name: 'Lipid Panel', category: 'Chemistry', normalRange: 'Cholesterol < 200', unit: 'mg/dL' },
                        { id: 103, code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrinology', normalRange: '0.4 - 4.0', unit: 'mIU/L' },
                        { id: 104, code: 'A1C', name: 'Hemoglobin A1C', category: 'Chemistry', normalRange: '< 5.7', unit: '%' },
                        { id: 105, code: 'VITD', name: 'Vitamin D, 25-Hydroxy', category: 'Chemistry', normalRange: '30 - 100', unit: 'ng/mL' },
                    ]);
                } else {
                    setLabTests(json.data.metadata.labTests);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleTestSelection = (testId: string) => {
        if (selectedTestIds.includes(testId)) {
            setSelectedTestIds(selectedTestIds.filter(id => id !== testId));
        } else {
            setSelectedTestIds([...selectedTestIds, testId]);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTestIds.length === 0) {
            alert('الرجاء تحديد تحليل واحد على الأقل.');
            return;
        }

        try {
            const res = await fetch('/api/clinic/lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    notes,
                    testIds: selectedTestIds
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowCreateModal(false);
                setSelectedTestIds([]);
                fetchData();
                alert('تم إنشاء طلب التحليل بنجاح وإرساله لنظام LIS.');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateResult = async (resultId: number, value: string, isAbnormal: boolean) => {
        try {
            const res = await fetch('/api/clinic/lab', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resultId,
                    value,
                    isAbnormal
                })
            });
            const data = await res.json();
            if (data.success) {
                // local state update for fast UI
                const updatedOrders = [...orders];
                const order = updatedOrders.find(o => o.id === showResultsModal.id);
                if (order) {
                    const result = order.results.find((r: any) => r.id === resultId);
                    if (result) {
                        result.value = value;
                        result.isAbnormal = isAbnormal;
                    }
                    // check if all completed to update status locally
                    const allDone = order.results.every((r: any) => r.value && r.value.trim() !== '');
                    order.status = allDone ? 'COMPLETED' : 'IN_PROCESS';
                }
                setOrders(updatedOrders);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-indigo-500 dark:border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🔬</span> نظام إدارة المختبرات (LIS Integration)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">طلبات التحاليل الطبية وإدخال النتائج مع تحديد القراءات غير الطبيعية (Abnormal Flags).</p>
                </div>
                <div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-md font-bold shadow hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <span>+</span> طلب تحليل جديد
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 font-semibold">رقم الطلب</th>
                                    <th className="p-4 font-semibold">التاريخ</th>
                                    <th className="p-4 font-semibold">المريض</th>
                                    <th className="p-4 font-semibold">الطبيب الطالب</th>
                                    <th className="p-4 font-semibold">التحاليل المطلوبة</th>
                                    <th className="p-4 font-semibold">الحالة</th>
                                    <th className="p-4 font-semibold text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">لا توجد طلبات تحاليل مسجلة.</td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="p-4 font-mono font-bold">LAB-{String(order.id).padStart(5, '0')}</td>
                                            <td className="p-4 text-gray-500">{new Date(order.date).toLocaleDateString('en-GB')}</td>
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">{order.patient?.nameAr || 'غير معروف'}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">د. {order.doctor?.nameAr || 'طبيب'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {order.results.map((r: any) => (
                                                        <span key={r.id} className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded border dark:border-gray-600">
                                                            {r.test?.code || `Test #${r.testId}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                                                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                    order.status === 'IN_PROCESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                }`}>
                                                    {order.status === 'PENDING' ? 'قيد الانتظار' : order.status === 'IN_PROCESS' ? 'جاري الفحص' : 'مكتمل'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => setShowResultsModal(order)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded"
                                                >
                                                    {order.status === 'COMPLETED' ? 'عرض النتائج' : 'إدخال النتائج'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <span>🧪</span> طلب تحاليل مخبرية جديد
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-2xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleCreateOrder} className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">المريض</label>
                                    <select required value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="">-- اختر المريض --</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الطبيب الطالب</label>
                                    <select required value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                        <option value="">-- اختر الطبيب --</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>د. {d.nameAr}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">قائمة التحاليل المتاحة (يرجى التحديد)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {labTests.map(test => (
                                        <div key={test.id} 
                                            className={`border rounded-lg p-3 cursor-pointer transition ${selectedTestIds.includes(String(test.id)) ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-400 shadow-sm ring-1 ring-indigo-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}
                                            onClick={() => toggleTestSelection(String(test.id))}
                                        >
                                            <div className="flex items-start gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTestIds.includes(String(test.id))}
                                                    onChange={() => {}} // handled by div click
                                                    className="mt-1 accent-indigo-600"
                                                />
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{test.code}</div>
                                                    <div className="text-xs text-gray-500 truncate w-full" title={test.name}>{test.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات للمختبر (Clinical Notes)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 rounded font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition">
                                    إلغاء
                                </button>
                                <button type="submit" className="px-6 py-2 rounded font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow transition">
                                    إصدار طلب التحليل
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                            <div>
                                <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                                    نتائج التحاليل: LAB-{String(showResultsModal.id).padStart(5, '0')}
                                </h2>
                                <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">المريض: {showResultsModal.patient?.nameAr}</p>
                            </div>
                            <button onClick={() => setShowResultsModal(null)} className="text-gray-500 hover:text-red-500 font-bold text-2xl">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold w-1/3">التحليل (Test)</th>
                                        <th className="p-4 font-semibold">النتيجة (Result)</th>
                                        <th className="p-4 font-semibold">المعدل الطبيعي (Reference)</th>
                                        <th className="p-4 font-semibold text-center w-24">Abnormal</th>
                                        <th className="p-4 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showResultsModal.results.map((result: any) => {
                                        // internal state for each row to allow editing before saving
                                        const [val, setVal] = useState(result.value || '');
                                        const [abnormal, setAbnormal] = useState(result.isAbnormal);
                                        const [saving, setSaving] = useState(false);

                                        const saveResult = async () => {
                                            setSaving(true);
                                            await handleUpdateResult(result.id, val, abnormal);
                                            setSaving(false);
                                        };

                                        return (
                                            <tr key={result.id} className="border-b dark:border-gray-700">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900 dark:text-white">{result.test?.name || 'Unknown Test'}</div>
                                                    <div className="text-xs text-gray-500 font-mono mt-1">{result.test?.code}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={val}
                                                            onChange={e => setVal(e.target.value)}
                                                            className={`border rounded p-2 w-32 dark:bg-gray-800 dark:text-white ${abnormal ? 'border-red-500 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/10' : 'dark:border-gray-600'}`}
                                                            placeholder="أدخل القيمة"
                                                        />
                                                        <span className="text-xs text-gray-500">{result.test?.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-500">{result.test?.normalRange}</td>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={abnormal}
                                                        onChange={e => setAbnormal(e.target.checked)}
                                                        className="w-5 h-5 accent-red-500"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={saveResult}
                                                        disabled={saving || (val === result.value && abnormal === result.isAbnormal)}
                                                        className={`px-3 py-1 rounded text-xs font-bold transition ${
                                                            saving ? 'bg-gray-200 text-gray-500' :
                                                            (val === result.value && abnormal === result.isAbnormal) ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600' :
                                                            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                        }`}
                                                    >
                                                        {saving ? '...' : (val === result.value && abnormal === result.isAbnormal && val) ? 'محفوظ ✔' : 'حفظ'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                💡 قم بإدخال النتائج واضغط على "حفظ" لكل تحليل. سيتم تحويل حالة الطلب إلى مكتمل تلقائياً عند إدخال جميع النتائج.
                            </p>
                            <button onClick={() => setShowResultsModal(null)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded font-bold transition">
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
