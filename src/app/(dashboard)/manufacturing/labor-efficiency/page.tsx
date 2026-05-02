'use client';
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function LaborEfficiencyPage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/manufacturing/labor-efficiency')
            .then(r => r.json())
            .then(d => { setData(d.data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-8 h-8" /></div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">انحراف كفاءة العمالة (Labor Efficiency)</h1>
                    <p className="text-gray-500">مقارنة الساعات المعيارية بالساعات الفعلية المستهلكة</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <table className="min-w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-gray-500 font-medium">أمر الإنتاج</th>
                            <th className="px-6 py-4 text-gray-500 font-medium">الساعات المعيارية (المخططة)</th>
                            <th className="px-6 py-4 text-gray-500 font-medium">الساعات الفعلية (المقدرة)</th>
                            <th className="px-6 py-4 text-gray-500 font-medium">الانحراف (Variance)</th>
                            <th className="px-6 py-4 text-gray-500 font-medium">الكفاءة %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <tr><td colSpan={5} className="text-center py-8">جاري التحميل...</td></tr> : 
                         data.length === 0 ? <tr><td colSpan={5} className="text-center py-8">لا توجد بيانات متاحة</td></tr> :
                         data.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800">{row.orderNumber}</td>
                                <td className="px-6 py-4 text-gray-600">{row.standardHours}</td>
                                <td className="px-6 py-4 text-gray-600">{row.actualHours}</td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1 font-bold ${row.status === 'Favorable' ? 'text-green-600' : 'text-red-600'}`}>
                                        {row.status === 'Favorable' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                                        {row.efficiencyVariance} س
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${parseFloat(row.efficiencyPercentage) >= 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {row.efficiencyPercentage}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
