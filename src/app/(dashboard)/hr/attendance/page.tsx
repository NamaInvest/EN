"use client";

import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, CalendarDays, ArrowRightToLine, ArrowLeftFromLine, ShieldAlert } from 'lucide-react';

export default function AttendanceDashboard() {
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [employeeId, setEmployeeId] = useState('');
    const [notification, setNotification] = useState<{type: 'success'|'error', msg: string}|null>(null);

    const fetchData = async () => {
        try {
            const [resAtt, resEmps] = await Promise.all([
                fetch('/api/hr/attendance'),
                fetch('/api/employees')
            ]);
            if (resAtt.ok) setRecords(await resAtt.json());
            if (resEmps.ok) setEmployees(await resEmps.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (action: 'check-in' | 'check-out') => {
        if (!employeeId) return setNotification({ type: 'error', msg: 'يرجى اختيار الموظف' });
        
        setNotification(null);
        try {
            const res = await fetch('/api/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, action })
            });
            if (res.ok) {
                setNotification({ type: 'success', msg: action === 'check-in' ? 'تم تسجيل الدخول بنجاح' : 'تم تسجيل الانصراف بنجاح' });
                fetchData();
            } else {
                const data = await res.json();
                setNotification({ type: 'error', msg: data.error || 'حدث خطأ' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'فشل الاتصال بالخادم' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex items-center justify-between backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                            <UserCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">الحضور والانصراف</h1>
                            <p className="text-slate-400 mt-1">تسجيل الوقت ومتابعة الحضور الآلي</p>
                        </div>
                    </div>
                </div>

                {notification && (
                    <div className={`p-4 rounded-xl flex items-center ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {notification.msg}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Action Panel */}
                    <div className="backdrop-blur-md bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Clock className="w-5 h-5 ml-2 text-cyan-400" /> تسجيل البصمة اليدوية
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">الموظف</label>
                                <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none">
                                    <option value="" disabled>-- اختر الموظف --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleAction('check-in')} className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-2xl transition-all group">
                                    <ArrowRightToLine className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold">تسجيل دخول</span>
                                </button>
                                <button onClick={() => handleAction('check-out')} className="flex flex-col items-center justify-center p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl transition-all group">
                                    <ArrowLeftFromLine className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold">تسجيل انصراف</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="lg:col-span-2 backdrop-blur-xl bg-slate-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <CalendarDays className="w-5 h-5 ml-2 text-blue-400" /> سجل حضور اليوم
                            </h2>
                        </div>
                        
                        {loading ? (
                            <div className="p-10 text-center text-slate-500 flex justify-center items-center flex-1"><Clock className="w-5 h-5 animate-spin ml-2" /> جاري التحميل...</div>
                        ) : (
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-right h-full">
                                    <thead>
                                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                            <th className="px-6 py-4 font-medium">الموظف</th>
                                            <th className="px-6 py-4 font-medium">التاريخ</th>
                                            <th className="px-6 py-4 font-medium">وقت الدخول</th>
                                            <th className="px-6 py-4 font-medium">وقت الانصراف</th>
                                            <th className="px-6 py-4 font-medium">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {records.map(record => (
                                            <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{record.employee?.name}</td>
                                                <td className="px-6 py-4 text-slate-300">{record.date}</td>
                                                <td className="px-6 py-4 text-emerald-400 font-mono">{record.checkIn || '-'}</td>
                                                <td className="px-6 py-4 text-rose-400 font-mono">{record.checkOut || '-'}</td>
                                                <td className="px-6 py-4">
                                                    {!record.checkOut ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">على رأس العمل</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">مكتمل</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {records.length === 0 && (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد حركات لليوم</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
