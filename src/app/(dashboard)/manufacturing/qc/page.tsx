'use client';
import React, { useState, useEffect } from 'react';
import { Microscope, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function QCPage() {
    const [orders, setOrders] = useState([]);
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ manufacturingOrderId: '', inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0, notes: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [woRes, qcRes] = await Promise.all([
                fetch('/api/manufacturing/work-orders'),
                fetch('/api/manufacturing/quality-control')
            ]);
            const woData = await woRes.json();
            const qcData = await qcRes.json();
            if (woRes.ok) setOrders(woData.filter((o:any) => o.status === 'in_progress' || o.status === 'completed'));
            if (qcRes.ok) setChecks(qcData);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/manufacturing/quality-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchData();
                setFormData({ manufacturingOrderId: '', inspectedQuantity: 0, passedQuantity: 0, failedQuantity: 0, notes: '' });
            }
        } catch (error) {
            console.error('Error creating QC log', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Microscope className="w-6 h-6 text-blue-600" />
                    بوابة الجودة والمطابقة (Quality Control)
                </h1>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    <CheckCircle className="w-5 h-5" /> تسجيل فحص جديد
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded shadow mb-6 border-t-4 border-blue-500">
                    <h2 className="text-xl font-semibold mb-4">نموذج الفحص المخزني</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">أمر التصنيع المرتبط</label>
                            <select required className="w-full border p-2 rounded" value={formData.manufacturingOrderId} onChange={e => setFormData({...formData, manufacturingOrderId: e.target.value})}>
                                <option value="">اختر أمر التصنيع...</option>
                                {orders.map((o: any) => (
                                    <option key={o.id} value={o.id}>{o.orderNumber} - {o.recipe?.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">الكمية المفحوصة (إجمالي)</label>
                            <input required type="number" className="w-full border p-2 rounded" value={formData.inspectedQuantity} onChange={e => setFormData({...formData, inspectedQuantity: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm text-green-700 font-bold mb-1">الكمية المطابقة (نجاح)</label>
                            <input required type="number" className="w-full border p-2 rounded border-green-300" value={formData.passedQuantity} onChange={e => setFormData({...formData, passedQuantity: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm text-red-700 font-bold mb-1">الكمية التالفة (هدر / Scrap)</label>
                            <input required type="number" className="w-full border p-2 rounded border-red-300" value={formData.failedQuantity} onChange={e => setFormData({...formData, failedQuantity: parseFloat(e.target.value)})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">ملاحظات الفاحص (أسباب الرفض إن وجدت)</label>
                            <textarea className="w-full border p-2 rounded" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">اعتماد الفحص</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full text-right">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-gray-500 font-medium">رقم الأمر</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">التاريخ</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">الكمية المفحوصة</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">المطابق</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">التالف (Scrap)</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">النتيجة المحاسبية</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <tr><td colSpan={6} className="text-center py-4">جاري التحميل...</td></tr> :
                         checks.length === 0 ? <tr><td colSpan={6} className="text-center py-4">لا توجد سجلات فحص</td></tr> :
                         checks.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-blue-600">{c.order?.orderNumber}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(c.checkDate).toLocaleDateString('ar-SA')}</td>
                                <td className="px-6 py-4">{c.inspectedQuantity}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">{c.passedQuantity}</td>
                                <td className="px-6 py-4 text-red-600 font-bold">{c.failedQuantity}</td>
                                <td className="px-6 py-4">
                                    {c.failedQuantity > 0 ? (
                                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                            <AlertTriangle className="w-3 h-3"/> تم تحميل هدر مالي
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            <CheckCircle className="w-3 h-3"/> لا يوجد هدر
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
