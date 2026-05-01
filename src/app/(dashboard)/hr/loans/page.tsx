"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Activity, Search, ShieldCheck, Wallet, ArrowDownRight, Clock } from 'lucide-react';

export default function LoansDashboard() {
    const [loans, setLoans] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [employeeId, setEmployeeId] = useState('');
    const [amount, setAmount] = useState('');
    const [monthlyDeduction, setMonthlyDeduction] = useState('');
    const [reason, setReason] = useState('');
    const [notification, setNotification] = useState<{type: 'success'|'error', msg: string}|null>(null);

    const fetchData = async () => {
        try {
            const [resLoans, resEmps] = await Promise.all([
                fetch('/api/hr/loans'),
                fetch('/api/employees')
            ]);
            if (resLoans.ok) setLoans(await resLoans.json());
            if (resEmps.ok) setEmployees(await resEmps.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotification(null);
        try {
            const res = await fetch('/api/hr/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, amount, monthlyDeduction, reason })
            });
            if (res.ok) {
                setNotification({ type: 'success', msg: 'تم تسجيل السلفة بنجاح!' });
                setShowModal(false);
                fetchData();
                setAmount(''); setMonthlyDeduction(''); setReason('');
            } else {
                setNotification({ type: 'error', msg: 'حدث خطأ أثناء الحفظ' });
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
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">إدارة السلف والمديونيات</h1>
                            <p className="text-slate-400 mt-1">يتم خصم السلف آلياً عند إصدار مسيرات الرواتب</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30"
                    >
                        <Plus className="w-5 h-5 ml-2" /> سلفة جديدة
                    </button>
                </div>

                {notification && (
                    <div className={`p-4 rounded-xl flex items-center ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {notification.msg}
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-indigo-500/20 rounded-xl"><Wallet className="w-6 h-6 text-indigo-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">إجمالي السلف النشطة</p>
                            <h3 className="text-2xl font-bold text-white">
                                {loans.reduce((acc, curr) => curr.status === 'active' ? acc + curr.remainingAmount : acc, 0).toLocaleString()} <span className="text-xs text-indigo-400">SAR</span>
                            </h3>
                        </div>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-emerald-500/20 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">السلف المسددة</p>
                            <h3 className="text-2xl font-bold text-white">
                                {loans.filter(l => l.status === 'paid').length} <span className="text-xs text-emerald-400">سلفة</span>
                            </h3>
                        </div>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-rose-500/20 rounded-xl"><ArrowDownRight className="w-6 h-6 text-rose-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">خصومات هذا الشهر (المتوقعة)</p>
                            <h3 className="text-2xl font-bold text-white">
                                {loans.reduce((acc, curr) => curr.status === 'active' ? acc + curr.monthlyDeduction : acc, 0).toLocaleString()} <span className="text-xs text-rose-400">SAR</span>
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="backdrop-blur-xl bg-slate-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <Activity className="w-5 h-5 ml-2 text-indigo-400" /> سجل السلف
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                            <input type="text" placeholder="بحث باسم الموظف..." className="bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-10 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64" />
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="p-10 text-center text-slate-500 flex justify-center items-center"><Clock className="w-5 h-5 animate-spin ml-2" /> جاري التحميل...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                        <th className="px-6 py-4 font-medium">الموظف</th>
                                        <th className="px-6 py-4 font-medium">السبب</th>
                                        <th className="px-6 py-4 font-medium">المبلغ الأصلي</th>
                                        <th className="px-6 py-4 font-medium">القسط الشهري</th>
                                        <th className="px-6 py-4 font-medium">الرصيد المتبقي</th>
                                        <th className="px-6 py-4 font-medium">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loans.map(loan => (
                                        <tr key={loan.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{loan.employee?.name}</td>
                                            <td className="px-6 py-4 text-slate-300">{loan.reason || '-'}</td>
                                            <td className="px-6 py-4 text-slate-300">{loan.amount.toLocaleString()} SAR</td>
                                            <td className="px-6 py-4 text-rose-400 font-mono">-{loan.monthlyDeduction.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-indigo-300 font-bold">{loan.remainingAmount.toLocaleString()} SAR</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    loan.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                    {loan.status === 'active' ? 'قائمة' : 'مسددة'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {loans.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">لا توجد سلف مسجلة حالياً</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 transform animate-in zoom-in-95">
                        <h2 className="text-2xl font-bold text-white mb-6">صرف سلفة جديدة</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">الموظف</label>
                                <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none">
                                    <option value="" disabled>-- اختر الموظف --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">إجمالي السلفة (SAR)</label>
                                    <input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الخصم الشهري (SAR)</label>
                                    <input required type="number" min="1" value={monthlyDeduction} onChange={e => setMonthlyDeduction(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-rose-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">سبب أو تفاصيل السلفة (اختياري)</label>
                                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                            </div>
                            <div className="flex space-x-4 space-x-reverse pt-4">
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30">اعتماد السلفة</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-all">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
