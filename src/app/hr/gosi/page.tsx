'use client';
import { useState, useEffect } from 'react';

export default function GOSIPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const fetchData = async () => {
        setLoading(true);
        const res = await fetch(`/api/hr/gosi?month=${month}&year=${year}`);
        setData(await res.json());
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [month, year]);

    const postGosi = async () => {
        setPosting(true);
        const res = await fetch('/api/hr/gosi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, year }),
        });
        const result = await res.json();
        alert(result.message || 'تم');
        setPosting(false);
    };

    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🏛️ التأمينات الاجتماعية GOSI</h1>
                    <p className="text-gray-400 text-sm mt-1">احتساب ودفع اشتراكات التأمينات وفق اللوائح السعودية</p>
                </div>
                <button onClick={postGosi} disabled={posting}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl font-medium text-sm transition-colors">
                    {posting ? 'جارٍ التسجيل...' : '✅ تسجيل القيد المحاسبي'}
                </button>
            </div>

            <div className="flex gap-3 mb-6">
                <select value={month} onChange={e => setMonth(+e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(+e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                </select>
            </div>

            {loading ? <div className="text-center py-20 text-gray-500">جارٍ الاحتساب...</div> : data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'خصم الموظف', value: `${data.totals?.totalEmployeeDeductions?.toFixed(2)} ر.س`, icon: '👤' },
                            { label: 'مساهمة صاحب العمل', value: `${data.totals?.totalEmployerContributions?.toFixed(2)} ر.س`, icon: '🏢' },
                            { label: 'إجمالي GOSI', value: `${data.totals?.totalGosi?.toFixed(2)} ر.س`, icon: '📊' },
                            { label: 'الموظفون السعوديون', value: data.totals?.saudiCount, icon: '🇸🇦' },
                        ].map(card => (
                            <div key={card.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                                <div className="text-2xl mb-2">{card.icon}</div>
                                <div className="text-xl font-bold text-white">{card.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{card.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-xs text-gray-300 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>موظف سعودي: <b className="text-white">10%</b></div>
                        <div>صاحب العمل للسعودي: <b className="text-white">12%</b></div>
                        <div>مخاطر مهنية: <b className="text-white">2%</b></div>
                        <div>صاحب العمل للوافد: <b className="text-white">2%</b></div>
                    </div>
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-400 text-xs">
                                        <th className="text-right p-3">الموظف</th>
                                        <th className="text-right p-3">الجنسية</th>
                                        <th className="text-right p-3">الراتب</th>
                                        <th className="text-right p-3">خصم الموظف</th>
                                        <th className="text-right p-3">مساهمة المنشأة</th>
                                        <th className="text-right p-3">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.employees || []).map((emp: any) => (
                                        <tr key={emp.employeeId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                            <td className="p-3 font-medium">{emp.name}</td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isSaudi ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {emp.isSaudi ? '🇸🇦 سعودي' : '🌍 وافد'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-300">{emp.baseSalary?.toLocaleString()} ر.س</td>
                                            <td className="p-3 text-blue-400">{emp.employeeDeduction?.toFixed(2)} ر.س</td>
                                            <td className="p-3 text-purple-400">{emp.employerContribution?.toFixed(2)} ر.س</td>
                                            <td className="p-3 text-emerald-400 font-bold">{emp.totalGosi?.toFixed(2)} ر.س</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
