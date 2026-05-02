'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Plus, PlayCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function WorkCentersPage() {
    const { success, info } = useToast();

    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', costPerHour: 0, capacity: 1 });

    useEffect(() => { fetchCenters(); }, []);

    const fetchCenters = async () => {
        try {
            const res = await fetch('/api/manufacturing/work-centers');
            const data = await res.json();
            if (res.ok) setCenters(data);
        } catch (error) {
            console.error('Error fetching centers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/manufacturing/work-centers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchCenters();
                setFormData({ name: '', code: '', costPerHour: 0, capacity: 1 });
            }
        } catch (error) {
            console.error('Error creating work center', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    مراكز العمل والمسارات (Work Centers)
                </h1>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5" /> إضافة مركز عمل
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4">مركز عمل جديد</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">اسم المركز (مثال: محطة اللحام)</label>
                            <input required type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">الكود</label>
                            <input required type="text" className="w-full border p-2 rounded" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">تكلفة التشغيل للساعة (ريال)</label>
                            <input required type="number" step="0.01" className="w-full border p-2 rounded" value={formData.costPerHour} onChange={e => setFormData({...formData, costPerHour: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">السعة (Capacity)</label>
                            <input required type="number" step="0.1" className="w-full border p-2 rounded" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseFloat(e.target.value)})} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button   type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">حفظ المركز</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full text-right">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-gray-500 font-medium">اسم المركز</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">الكود</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">تكلفة الساعة</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">السعة</th>
                            <th className="px-6 py-3 text-gray-500 font-medium">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <tr><td colSpan={5} className="text-center py-4">جاري التحميل...</td></tr> :
                         centers.length === 0 ? <tr><td colSpan={5} className="text-center py-4">لا توجد مراكز عمل</td></tr> :
                         centers.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                <td className="px-6 py-4 text-gray-600">{c.code}</td>
                                <td className="px-6 py-4 text-indigo-600 font-bold">{c.costPerHour} SAR</td>
                                <td className="px-6 py-4">{c.capacity}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">نشط</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
